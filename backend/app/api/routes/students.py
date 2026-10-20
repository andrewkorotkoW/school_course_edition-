from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Progress, Quest, Student
from app.schemas.student import QuestCompleteIn, QuestCompleteOut

router = APIRouter(prefix="/students", tags=["students"])


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
