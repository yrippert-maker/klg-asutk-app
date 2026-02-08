"""
RisingWave интеграция
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings
import logging
import re

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None

# Whitelist допустимых имён materialized views
ALLOWED_VIEWS = {
    "mv_aircraft_status",
    "mv_audit_summary",
    "mv_risk_alerts",
    "mv_compliance_stats",
    "mv_airworthiness_overview",
    "mv_notifications_recent",
}


async def init_risingwave():
    """Инициализация RisingWave (только при ENABLE_RISINGWAVE=true)"""
    from app.core.config import settings
    if not settings.ENABLE_RISINGWAVE:
        raise NotImplementedError("RisingWave отключён для MVP. Установите ENABLE_RISINGWAVE=true.")
    global engine, SessionLocal

    engine = create_async_engine(
        settings.RISINGWAVE_URL.replace('postgresql://', 'postgresql+asyncpg://'),
        echo=False,
    )

    SessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    logger.info("RisingWave connection pool created")


def _validate_view_name(view_name: str) -> str:
    """Валидация имени view против whitelist и формата"""
    if view_name not in ALLOWED_VIEWS:
        raise ValueError(f"View '{view_name}' is not in the allowed list. Allowed: {ALLOWED_VIEWS}")
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', view_name):
        raise ValueError(f"Invalid view name format: '{view_name}'")
    return view_name


async def query_materialized_view(view_name: str, filters: dict = None):
    """Запрос к materialized view (с защитой от SQL injection)"""
    if not settings.ENABLE_RISINGWAVE:
        raise NotImplementedError("RisingWave отключён для MVP.")
    if not SessionLocal:
        await init_risingwave()

    safe_view = _validate_view_name(view_name)

    async with SessionLocal() as session:
        if filters:
            conditions = " AND ".join([f"{k} = :{k}" for k in filters.keys()])
            query = text(f"SELECT * FROM {safe_view} WHERE {conditions}")
            result = await session.execute(query, filters)
        else:
            query = text(f"SELECT * FROM {safe_view}")
            result = await session.execute(query)
        return result.fetchall()
