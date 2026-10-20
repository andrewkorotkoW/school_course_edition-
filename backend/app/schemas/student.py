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


class QuestCompleteIn(BaseModel):
    student_id: int
    quest_id: int


class QuestCompleteOut(BaseModel):
    student_id: int
    quest_id: int
    completed: bool


class TaskOut(BaseModel):
    """Answer-free view of a task - correct_answer/explanation stay server-side."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    quest_id: int
    order: int
    type: str
    prompt: str
    options: list[str] | None
    puzzle_kind: str | None = None
    config: dict | None = None
    completed: bool = False


class TaskCheckIn(BaseModel):
    student_id: int
    answer: str


class TaskCheckOut(BaseModel):
    correct: bool
    explanation: str
