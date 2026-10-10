from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Progress, Quest, Student, Wallet
from app.schemas.student import QuestCompleteIn
from app.schemas.town import TownOut
from app.services.town import get_town_state

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/quests/complete", response_model=TownOut)
def complete_quest(payload: QuestCompleteIn, db: Session = Depends(get_db)) -> TownOut:
    """Mark a quest done and credit the wallet. Idempotent: repeat calls don't double-pay."""
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
    wallet = db.scalar(select(Wallet).where(Wallet.student_id == payload.student_id))
    if wallet is None:
        wallet = Wallet(student_id=payload.student_id, earned_points=0)
        db.add(wallet)

    if already_done is None:
        db.add(Progress(student_id=payload.student_id, quest_id=payload.quest_id))
        wallet.earned_points += quest.reward_points

    db.commit()

    return get_town_state(db, payload.student_id)
