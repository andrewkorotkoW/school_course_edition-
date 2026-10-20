from datetime import datetime

from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Parent(Base):
    __tablename__ = "parents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)

    students: Mapped[list["Student"]] = relationship(back_populates="parent")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    grade: Mapped[int]  # 1-4 for the MVP slice
    parent_id: Mapped[int] = mapped_column(ForeignKey("parents.id"))
    program_id: Mapped[int | None] = mapped_column(ForeignKey("programs.id"), nullable=True)

    parent: Mapped["Parent"] = relationship(back_populates="students")
    progress: Mapped[list["Progress"]] = relationship(back_populates="student")
    program: Mapped["Program | None"] = relationship(back_populates="students")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(unique=True)  # "math", "russian"
    name: Mapped[str]

    quests: Mapped[list["Quest"]] = relationship(back_populates="subject")


class Quest(Base):
    """A short, story-framed set of tasks for one topic. No scores, no timers."""

    __tablename__ = "quests"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    grade: Mapped[int]
    order: Mapped[int]
    title: Mapped[str]
    story_text: Mapped[str] = mapped_column(default="")

    subject: Mapped["Subject"] = relationship(back_populates="quests")
    tasks: Mapped[list["Task"]] = relationship(back_populates="quest", order_by="Task.order")


class Task(Base):
    """One exercise inside a quest. Checking is stateless and never penalizes -
    a wrong answer just shows the explanation so the student can retry."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"))
    order: Mapped[int]
    type: Mapped[str]  # "choice" | "input" | "puzzle"
    prompt: Mapped[str]
    options: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[str]
    explanation: Mapped[str] = mapped_column(default="")
    # Only set when type == "puzzle". puzzle_kind picks which frontend game
    # component renders the task (e.g. "count_click"); config is that
    # component's own data shape (e.g. {"items": ["🍎", ...]}).
    # The puzzle still submits a plain string answer through the same
    # /tasks/{id}/check endpoint as choice/input - only the UI differs.
    puzzle_kind: Mapped[str | None] = mapped_column(nullable=True)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    quest: Mapped["Quest"] = relationship(back_populates="tasks")


class Program(Base):
    """A curated set of quests assigned to a student, built from existing quests."""

    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    grade_from: Mapped[int]
    grade_to: Mapped[int]

    program_quests: Mapped[list["ProgramQuest"]] = relationship(back_populates="program")
    students: Mapped[list["Student"]] = relationship(back_populates="program")


class ProgramQuest(Base):
    """Many-to-many link between a Program and its Quests."""

    __tablename__ = "program_quests"
    __table_args__ = (UniqueConstraint("program_id", "quest_id", name="uq_program_quest"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"))

    program: Mapped["Program"] = relationship(back_populates="program_quests")
    quest: Mapped["Quest"] = relationship()


class Progress(Base):
    """Records that a student finished a quest. Completion only - no pass/fail state."""

    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("student_id", "quest_id", name="uq_student_quest"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"))
    completed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    student: Mapped["Student"] = relationship(back_populates="progress")
    quest: Mapped["Quest"] = relationship()


class TaskProgress(Base):
    """Records that a student answered one task correctly - finer-grained than
    Progress (which only tracks whole-quest completion). Lets the quest page
    resume at the right task after a reload instead of restarting from 1."""

    __tablename__ = "task_progress"
    __table_args__ = (UniqueConstraint("student_id", "task_id", name="uq_student_task"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    completed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    student: Mapped["Student"] = relationship()
    task: Mapped["Task"] = relationship()
