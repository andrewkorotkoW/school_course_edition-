from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Task, TaskProgress
from app.schemas.student import TaskCheckIn, TaskCheckOut, TaskOut

router = APIRouter(tags=["tasks"])


@router.get("/quests/{quest_id}/tasks", response_model=list[TaskOut])
def list_tasks(quest_id: int, student_id: int | None = None, db: Session = Depends(get_db)) -> list[TaskOut]:
    stmt = select(Task).where(Task.quest_id == quest_id).order_by(Task.order)
    tasks = list(db.scalars(stmt))

    completed_ids: set[int] = set()
    if student_id is not None and tasks:
        task_ids = [t.id for t in tasks]
        rows = db.scalars(
            select(TaskProgress.task_id).where(
                TaskProgress.student_id == student_id,
                TaskProgress.task_id.in_(task_ids),
            )
        )
        completed_ids = set(rows)

    return [
        TaskOut.model_validate(t, from_attributes=True).model_copy(update={"completed": t.id in completed_ids})
        for t in tasks
    ]


@router.post("/tasks/{task_id}/check", response_model=TaskCheckOut)
def check_task(task_id: int, payload: TaskCheckIn, db: Session = Depends(get_db)) -> TaskCheckOut:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    is_correct = payload.answer.strip().lower() == task.correct_answer.strip().lower()

    if is_correct:
        already = db.scalar(
            select(TaskProgress).where(
                TaskProgress.student_id == payload.student_id,
                TaskProgress.task_id == task_id,
            )
        )
        if already is None:
            db.add(TaskProgress(student_id=payload.student_id, task_id=task_id))
            db.commit()

    return TaskCheckOut(correct=is_correct, explanation=task.explanation)
