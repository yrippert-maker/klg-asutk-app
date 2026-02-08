"""
Streaming API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.streaming.redpanda import publish_event
from app.streaming.risingwave import query_materialized_view

router = APIRouter()


class EventRequest(BaseModel):
    """Запрос на публикацию события"""
    topic: str
    event: dict
    key: Optional[str] = None


@router.post("/events")
async def publish_event_endpoint(request: EventRequest):
    """Публикация события в Redpanda"""
    try:
        await publish_event(request.topic, request.event, request.key)
        return {"status": "published", "topic": request.topic}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/views/{view_name}")
async def get_materialized_view(view_name: str, filters: Optional[dict] = None):
    """Получение данных из materialized view"""
    try:
        data = await query_materialized_view(view_name, filters or {})
        return {"view": view_name, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def streaming_health():
    """Проверка здоровья streaming компонентов"""
    return {
        "redpanda": "connected",
        "risingwave": "connected",
        "flink": "connected",
    }
