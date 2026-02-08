"""
Журналирование событий (p.4.1.5 ТЗ).
Заглушка: полный audit_log будет реализован при наличии таблицы audit_events.
"""

from fastapi import APIRouter, Depends, Query
from typing import List
from datetime import datetime

from app.core.auth import get_current_user

router = APIRouter(tags=["audit"])


@router.get("/audit/events")
def list_audit_events(
    entity_type: str | None = Query(None, description="Фильтр по типу сущности"),
    entity_id: str | None = Query(None, description="Фильтр по ID сущности"),
    user=Depends(get_current_user),
):
    """Список событий аудита. Заглушка — возвращает пустой список."""
    # TODO: подключить таблицу audit_events и реальные данные
    return []
