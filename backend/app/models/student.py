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

    parent: Mapped["Parent"] = relationship(back_populates="students")
    island: Mapped["Island"] = relationship(back_populates="student", uselist=False)
    progress: Mapped[list["Progress"]] = relationship(back_populates="student")


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
    growth_points: Mapped[int] = mapped_column(default=10)  # island growth on completion

    subject: Mapped["Subject"] = relationship(back_populates="quests")
    tasks: Mapped[list["Task"]] = relationship(back_populates="quest", order_by="Task.order")


class Task(Base):
    """One exercise inside a quest. Checking is stateless and never penalizes -
    a wrong answer just shows the explanation so the student can retry."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"))
    order: Mapped[int]
    type: Mapped[str]  # "choice" | "input"
    prompt: Mapped[str]
    options: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[str]
    explanation: Mapped[str] = mapped_column(default="")

    quest: Mapped["Quest"] = relationship(back_populates="tasks")


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


class Island(Base):
    """The student's companion/island. Growth is monotonic - it never shrinks."""

    __tablename__ = "islands"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), unique=True)
    growth_points: Mapped[int] = mapped_column(default=0)

    student: Mapped["Student"] = relationship(back_populates="island")

    @property
    def stage(self) -> int:
        """Visual growth stage derived from accumulated points - tune thresholds later."""
        thresholds = [0, 30, 80, 150, 250]
        stage = 0
        for i, t in enumerate(thresholds):
            if self.growth_points >= t:
                stage = i
        return stage
