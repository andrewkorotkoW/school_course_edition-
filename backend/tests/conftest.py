import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db.session import Base
from app.main import app

# A single in-memory SQLite connection shared across the whole test session.
# StaticPool keeps one connection alive regardless of which thread FastAPI's
# sync dependency runs on - plain in-memory SQLite would otherwise give every
# new connection its own empty database.
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    # Intentionally not entering TestClient as a context manager: that would
    # fire FastAPI's startup event, which calls Base.metadata.create_all on
    # the app's real (Postgres) engine - something that must not happen in
    # tests that never start a database container.
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
