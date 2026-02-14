"""
Test configuration for КЛГ АСУ ТК backend.
Uses SQLite in-memory for fast isolated tests.
"""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Force test config BEFORE importing app modules
os.environ["DATABASE_URL"] = "sqlite:///test.db"
os.environ["ENABLE_DEV_AUTH"] = "true"
os.environ["DEV_TOKEN"] = "test"

from app.db.base import Base
from app.api.deps import get_db
from app.main import app
from app.models import *  # noqa: ensure all models registered

from fastapi.testclient import TestClient

engine = create_engine("sqlite:///test.db", connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """FastAPI test client with overridden DB dependency."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    """Dev auth headers."""
    return {"Authorization": "Bearer test"}
