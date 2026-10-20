from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, students, subjects, tasks
from app.core.config import settings
from app.db.session import Base, engine

app = FastAPI(title="EduQuest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(subjects.router)
app.include_router(students.router)
app.include_router(tasks.router)


@app.on_event("startup")
def on_startup() -> None:
    # MVP-only: creates tables directly. Replace with Alembic migrations
    # once the schema needs to evolve without dropping data.
    Base.metadata.create_all(bind=engine)
