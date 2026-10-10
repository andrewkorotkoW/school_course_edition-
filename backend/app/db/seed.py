"""Dev-only seed data: two subjects and one sample quest each. Run with:

    docker compose exec backend python -m app.db.seed
"""
from sqlalchemy import select

from app.db.session import Base, SessionLocal, engine
from app.models import Quest, Subject

SUBJECTS = [
    {"slug": "math", "name": "Математика"},
    {"slug": "russian", "name": "Русский язык"},
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for data in SUBJECTS:
            subject = db.scalar(select(Subject).where(Subject.slug == data["slug"]))
            if subject is None:
                subject = Subject(**data)
                db.add(subject)
                db.flush()

            has_quest = db.scalar(
                select(Quest).where(Quest.subject_id == subject.id, Quest.grade == 1)
            )
            if has_quest is None:
                db.add(
                    Quest(
                        subject_id=subject.id,
                        grade=1,
                        order=1,
                        title=f"Первый остров: {data['name']}",
                        story_text="Помоги маленькому жителю острова собрать первые задания.",
                        growth_points=10,
                    )
                )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
