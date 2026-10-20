from pydantic import BaseModel, ConfigDict

from app.schemas.student import QuestOut


class ProgramCreateIn(BaseModel):
    title: str
    grade_from: int
    grade_to: int
    quest_ids: list[int]


class ProgramOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    grade_from: int
    grade_to: int
    quests: list[QuestOut]


class ProgramAssignIn(BaseModel):
    student_id: int
