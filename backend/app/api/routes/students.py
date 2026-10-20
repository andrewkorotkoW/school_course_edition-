from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import ProgramQuest, Progress, Quest, Student
from app.schemas.student import QuestCompleteIn, QuestCompleteOut, QuestOut

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/{student_id}/quests", response_model=list[QuestOut])
def list_student_quests(student_id: int, db: Session = Depends(get_db)) -> list[QuestOut]:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    if student.program_id is None:
        # No program assigned yet - deliberately show nothing rather than all quests.
        return []

    stmt = (
        select(Quest)
        .join(ProgramQuest, ProgramQuest.quest_id == Quest.id)
        .where(ProgramQuest.program_id == student.program_id)
        .order_by(Quest.subject_id, Quest.grade, Quest.order)
    )
    quests = list(db.scalars(stmt))

    completed_ids: set[int] = set()
    if quests:
        quest_ids = [q.id for q in quests]
        rows = db.scalars(
            select(Progress.quest_id).where(
                Progress.student_id == student_id,
                Progress.quest_id.in_(quest_ids),
            )
        )
        completed_ids = set(rows)

    return [
        QuestOut.model_validate(q, from_attributes=True).model_copy(update={"completed": q.id in completed_ids})
        for q in quests
    ]


@router.post("/quests/complete", response_model=QuestCompleteOut)
def complete_quest(payload: QuestCompleteIn, db: Session = Depends(get_db)) -> QuestCompleteOut:
    """Mark a quest done. Idempotent: repeating the call doesn't error or duplicate."""
    student = db.get(Student, payload.student_id)
    quest = db.get(Quest, payload.quest_id)
    if student is None or quest is None:
        raise HTTPException(status_code=404, detail="Student or quest not found")

    already_done = db.scalar(
        select(Progress).where(
            Progress.student_id == payload.student_id,
            Progress.quest_id == payload.quest_id,
        )
    )
    if already_done is None:
        db.add(Progress(student_id=payload.student_id, quest_id=payload.quest_id))
        db.commit()

    return QuestCompleteOut(student_id=payload.student_id, quest_id=payload.quest_id, completed=True)
