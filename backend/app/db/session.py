from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# SQLite: check_same_thread=False; pool_pre_ping отключаем (для SQLite не нужен и может мешать).
_is_sqlite = "sqlite" in (settings.database_url or "")
_connect_args = {"check_same_thread": False} if _is_sqlite else {}
engine = create_engine(settings.database_url, pool_pre_ping=not _is_sqlite, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
