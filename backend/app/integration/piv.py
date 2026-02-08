"""П-ИВ integration stubs.

Соответствует требованиям ТЗ: использование П-ИВ АСУ ТК для интеграции и взаимодействия.

In the ASU TK variant, inbound/outbound data flows should go through П-ИВ.
This module provides a minimal HTTP client interface that can be swapped with
actual adapters when endpoint contracts are agreed.

Требуется уточнение согласно ТЗ:
- Форматы сообщений
- Расписания синхронизации
- ETL-pipeline
- Протоколирование
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


@dataclass
class PIVResult:
    ok: bool
    status_code: int
    payload: dict[str, Any] | None
    error: str | None = None


async def push_event(event_type: str, payload: dict[str, Any]) -> PIVResult:
    """Send an event to П-ИВ (prototype).

    Production mapping examples:
    - data upload logs
    - status changes (application workflow)
    """
    url = f"{settings.piv_base_url.rstrip('/')}/events"
    body = {"type": event_type, "payload": payload}
    try:
        async with httpx.AsyncClient(timeout=settings.piv_timeout_s) as client:
            r = await client.post(url, json=body)
        if 200 <= r.status_code < 300:
            return PIVResult(ok=True, status_code=r.status_code, payload=r.json() if r.content else None)
        return PIVResult(ok=False, status_code=r.status_code, payload=None, error=r.text)
    except Exception as e:
        return PIVResult(ok=False, status_code=0, payload=None, error=str(e))
