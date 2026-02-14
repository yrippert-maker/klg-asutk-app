"""
Database session management.
Sync engine for Alembic migrations + async-compatible session for routes.
Production: use connection pool with proper limits.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# ---------------------------------------------------------------------------
# Engine configuration
# ---------------------------------------------------------------------------
_is_sqlite = "sqlite" in (settings.database_url or "")
_connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(
    settings.database_url,
    pool_pre_ping=not _is_sqlite,
    connect_args=_connect_args,
    # Production pool settings for multi-user
    pool_size=20 if not _is_sqlite else 5,
    max_overflow=10 if not _is_sqlite else 0,
    pool_timeout=30,
    pool_recycle=1800,  # recycle connections every 30 min
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Multi-tenancy: set current org_id on connection (for RLS)
# ---------------------------------------------------------------------------
@event.listens_for(engine, "checkout")
def _reset_tenant(dbapi_conn, connection_record, connection_proxy):
    """Reset tenant context on connection checkout from pool."""
    cursor = dbapi_conn.cursor()
    try:
        cursor.execute("SET LOCAL app.current_org_id = ''")
    except Exception:
        pass  # SQLite doesn't support SET LOCAL
    finally:
        cursor.close()


def set_tenant(db: Session, org_id: str | None):
    """Set the current tenant for RLS policies."""
    if org_id and not _is_sqlite:
        db.execute(
            __import__("sqlalchemy").text(
                f"SET LOCAL app.current_org_id = '{org_id}'"
            )
        )


# ---------------------------------------------------------------------------
# Dependency injection
# ---------------------------------------------------------------------------
def get_db():
    """FastAPI dependency: yields a DB session, closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
