from sqlalchemy import select

from app.models import Quest, Subject
from tests.conftest import TestingSessionLocal, test_engine


def test_seed_provides_a_grade_5_quest_with_tasks_for_math_and_russian(monkeypatch, db_session):
    """Runs the real dev seed (app.db.seed.run) against the in-memory test
    database to check the grade 1-5 content expansion: for both math and
    russian there must be at least one grade 5 quest with real tasks."""
    import app.db.seed as seed_module

    monkeypatch.setattr(seed_module, "engine", test_engine)
    monkeypatch.setattr(seed_module, "SessionLocal", TestingSessionLocal)

    seed_module.run()

    for slug in ("math", "russian"):
        quest = db_session.scalar(
            select(Quest).join(Subject).where(Subject.slug == slug, Quest.grade == 5)
        )
        assert quest is not None, f"нет квеста 5 класса для предмета {slug}"
        assert len(quest.tasks) >= 1, f"квест 5 класса по предмету {slug} без заданий"
