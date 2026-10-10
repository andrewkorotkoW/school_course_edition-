from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Quest, Subject
from app.schemas.student import QuestOut, SubjectOut

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)) -> list[Subject]:
    return list(db.scalars(select(Subject)))


@router.get("/{slug}/quests", response_model=list[QuestOut])
def list_quests(slug: str, grade: int, db: Session = Depends(get_db)) -> list[Quest]:
    subject = db.scalar(select(Subject).where(Subject.slug == slug))
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    stmt = (
        select(Quest)
        .where(Quest.subject_id == subject.id, Quest.grade == grade)
        .order_by(Quest.order)
    )
    return list(db.scalars(stmt))
