from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.catalog import CATALOG_BY_KEY
from app.models import OwnedBuilding, Wallet
from app.schemas.town import TownOut


def get_town_state(db: Session, student_id: int) -> TownOut:
    """Balance = everything ever earned minus the cost of everything owned.
    Nothing here is stored directly - it's recomputed from the wallet and
    owned-buildings rows so the two can never drift out of sync."""
    wallet = db.scalar(select(Wallet).where(Wallet.student_id == student_id))
    earned_points = wallet.earned_points if wallet else 0

    owned_rows = list(db.scalars(select(OwnedBuilding).where(OwnedBuilding.student_id == student_id)))
    owned = [CATALOG_BY_KEY[row.building_key] for row in owned_rows if row.building_key in CATALOG_BY_KEY]
    spent = sum(b["cost"] for b in owned)

    return TownOut(
        student_id=student_id,
        earned_points=earned_points,
        balance=earned_points - spent,
        owned=owned,
    )
