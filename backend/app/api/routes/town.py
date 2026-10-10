from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.catalog import CATALOG, CATALOG_BY_KEY
from app.models import OwnedBuilding, Student
from app.schemas.town import BuildingOut, BuyBuildingIn, TownOut
from app.services.town import get_town_state

router = APIRouter(tags=["town"])


@router.get("/buildings/catalog", response_model=list[BuildingOut])
def list_catalog() -> list[dict]:
    return CATALOG


@router.get("/students/{student_id}/town", response_model=TownOut)
def get_town(student_id: int, db: Session = Depends(get_db)) -> TownOut:
    return get_town_state(db, student_id)


@router.post("/students/{student_id}/buildings/buy", response_model=TownOut)
def buy_building(student_id: int, payload: BuyBuildingIn, db: Session = Depends(get_db)) -> TownOut:
    if payload.building_key not in CATALOG_BY_KEY:
        raise HTTPException(status_code=404, detail="Unknown building")

    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    already_owned = db.scalar(
        select(OwnedBuilding).where(
            OwnedBuilding.student_id == student_id,
            OwnedBuilding.building_key == payload.building_key,
        )
    )
    if already_owned is not None:
        raise HTTPException(status_code=400, detail="Already owned")

    state = get_town_state(db, student_id)
    cost = CATALOG_BY_KEY[payload.building_key]["cost"]
    if state.balance < cost:
        raise HTTPException(status_code=400, detail="Not enough points")

    db.add(OwnedBuilding(student_id=student_id, building_key=payload.building_key))
    db.commit()

    return get_town_state(db, student_id)
