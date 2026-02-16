"""AI-помощник REFLY — чат с контекстом из БД (для демо и докладов)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import SessionLocal
import httpx

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest, user=Depends(get_current_user)):
    api_key = getattr(settings, "ANTHROPIC_API_KEY", None) or ""
    proxy_url = getattr(settings, "AI_PROXY_URL", "") or ""
    proxy_secret = getattr(settings, "AI_PROXY_SECRET", "") or ""
    if not proxy_url or not proxy_secret:
        if not api_key or api_key == "":
            raise HTTPException(400, "AI assistant not configured (set ANTHROPIC_API_KEY or AI_PROXY_URL+AI_PROXY_SECRET)")

    db = SessionLocal()
    try:
        from app.models.aircraft_db import Aircraft
        from app.models.organization import Organization

        aircraft_count = db.query(Aircraft).count()
        org_count = db.query(Organization).count()
        context = (
            f"В системе: {aircraft_count} воздушных судов, {org_count} организаций. "
            f"Роль пользователя: {user.role}. Имя: {user.display_name}."
        )
    finally:
        db.close()

    system_prompt = f"""Ты — AI-помощник системы REFLY АСУ ТК (контроль лётной годности воздушных судов).
Ты помогаешь с вопросами о:
- Состоянии воздушных судов и их лётной годности
- Директивах лётной годности и сервисных бюллетенях
- Планировании ТО и инспекций
- Нормативных документах (ФАП, EASA, ICAO)
- Сертификации и допусках
- Управлении рисками безопасности полётов

Контекст системы: {context}

Отвечай на русском языке. Будь конкретным и профессиональным.
Используй авиационную терминологию где уместно."""

    payload = {
        "model": getattr(settings, "ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": "user", "content": req.message}],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        if proxy_url and proxy_secret:
            resp = await client.post(
                proxy_url,
                headers={
                    "x-proxy-secret": proxy_secret,
                    "content-type": "application/json",
                },
                json=payload,
            )
        else:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )

    if resp.status_code != 200:
        raise HTTPException(502, f"AI service error: {resp.status_code}")

    data = resp.json()
    content = data.get("content", [{}])
    reply = content[0].get("text", "Ошибка получения ответа") if content else "Ошибка получения ответа"
    return ChatResponse(reply=reply)
