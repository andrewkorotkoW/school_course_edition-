from pydantic import BaseModel, ConfigDict


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str


class QuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    grade: int
    order: int
    title: str
    story_text: str
    growth_points: int


class IslandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    student_id: int
    growth_points: int
    stage: int


class QuestCompleteIn(BaseModel):
    student_id: int
    quest_id: int
