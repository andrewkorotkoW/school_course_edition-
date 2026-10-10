from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import Task
from app.schemas.student import TaskCheckIn, TaskCheckOut, TaskOut

router = APIRouter(tags=["tasks"])


@router.get("/quests/{quest_id}/tasks", response_model=list[TaskOut])
def list_tasks(quest_id: int, db: Session = Depends(get_db)) -> list[Task]:
    stmt = select(Task).where(Task.quest_id == quest_id).order_by(Task.order)
    return list(db.scalars(stmt))


@router.post("/tasks/{task_id}/check", response_model=TaskCheckOut)
def check_task(task_id: int, payload: TaskCheckIn, db: Session = Depends(get_db)) -> TaskCheckOut:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    is_correct = payload.answer.strip().lower() == task.correct_answer.strip().lower()
    return TaskCheckOut(correct=is_correct, explanation=task.explanation)
