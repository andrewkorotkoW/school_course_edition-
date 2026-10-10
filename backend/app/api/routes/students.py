from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Island, Progress, Quest, Student
from app.schemas.student import IslandOut, QuestCompleteIn

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/{student_id}/island", response_model=IslandOut)
def get_island(student_id: int, db: Session = Depends(get_db)) -> Island:
    island = db.scalar(select(Island).where(Island.student_id == student_id))
    if island is None:
        raise HTTPException(status_code=404, detail="Island not found")
    return island


@router.post("/quests/complete", response_model=IslandOut)
def complete_quest(payload: QuestCompleteIn, db: Session = Depends(get_db)) -> Island:
    """Mark a quest done and grow the island. Idempotent: repeat calls don't double-grow."""
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
    island = db.scalar(select(Island).where(Island.student_id == payload.student_id))
    if island is None:
        island = Island(student_id=payload.student_id, growth_points=0)
        db.add(island)

    if already_done is None:
        db.add(Progress(student_id=payload.student_id, quest_id=payload.quest_id))
        island.growth_points += quest.growth_points

    db.commit()
    db.refresh(island)
    return island
