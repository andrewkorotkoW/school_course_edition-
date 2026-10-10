from pydantic import BaseModel


class BuildingOut(BaseModel):
    key: str
    name: str
    cost: int
    emoji: str


class TownOut(BaseModel):
    student_id: int
    earned_points: int
    balance: int
    owned: list[BuildingOut]


class BuyBuildingIn(BaseModel):
    building_key: str
