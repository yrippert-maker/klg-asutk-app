"""
WebSocket Connection Manager — real-time push для критических событий.
Поддерживает: connect(ws, user_id, org_id), send_to_user, send_to_org, broadcast.
Типы событий: ad_new_mandatory, defect_critical, life_limit_critical, wo_aog, wo_closed_crs и др.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Управление WebSocket: по user_id и org_id, плюс room для обратной совместимости."""

    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {}  # room -> set of websockets
        self._global: Set[WebSocket] = set()
        # По user_id / org_id для send_to_user, send_to_org
        self._connections: Dict[str, List[WebSocket]] = {}  # user_id -> list[WebSocket]
        self._org_users: Dict[str, Set[str]] = {}  # org_id -> set[user_id]

    async def connect(self, websocket: WebSocket, user_id: str | None = None, org_id: str | None = None, room: str = "global"):
        await websocket.accept()
        self._global.add(websocket)
        self.active.setdefault(room, set()).add(websocket)
        if user_id:
            self._connections.setdefault(user_id, []).append(websocket)
            if org_id:
                self._org_users.setdefault(org_id, set()).add(user_id)
        logger.info("WS connected: user_id=%s org_id=%s room=%s total=%d", user_id, org_id, room, len(self._global))

    def disconnect(self, websocket: WebSocket, user_id: str | None = None, org_id: str | None = None, room: str = "global"):
        self._global.discard(websocket)
        if room in self.active:
            self.active[room].discard(websocket)
        if user_id and user_id in self._connections:
            conns = self._connections[user_id]
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                del self._connections[user_id]
            if org_id and org_id in self._org_users:
                self._org_users[org_id].discard(user_id)
        logger.info("WS disconnected: total=%d", len(self._global))

    async def send_to_user(self, user_id: str, data: dict) -> None:
        """Отправить данные одному пользователю (всем его соединениям)."""
        for ws in self._connections.get(user_id, []):
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                logger.warning("Failed to send WS to user %s", user_id)

    async def send_to_org(self, org_id: str | None, data: dict) -> None:
        """Отправить данные всем пользователям организации."""
        if not org_id:
            return
        for uid in self._org_users.get(org_id, set()):
            if uid:
                await self.send_to_user(uid, data)

    async def broadcast(self, event_type_or_data: str | dict, data: dict | None = None, room: str = "global"):
        """Либо broadcast(data) — один dict для всех, либо broadcast(event_type, data, room) — по комнатам."""
        if data is None:
            # Один аргумент — payload dict, отправить всем (cert_applications, checklist_audits)
            payload = event_type_or_data
            if not isinstance(payload, dict):
                payload = {"event": str(event_type_or_data)}
            msg = json.dumps({**payload, "timestamp": datetime.now(timezone.utc).isoformat()})
            disconnected = set()
            for ws in self._global:
                try:
                    await ws.send_text(msg)
                except Exception:
                    disconnected.add(ws)
            for ws in disconnected:
                self._global.discard(ws)
            if self._global:
                logger.info("WS broadcast payload: sent=%d", len(self._global) - len(disconnected))
        else:
            # Старый формат: event_type, data, room
            message = json.dumps({
                "type": event_type_or_data,
                "data": data,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            targets = self.active.get(room, set()) | self._global
            disconnected = set()
            for ws in targets:
                try:
                    await ws.send_text(message)
                except Exception:
                    disconnected.add(ws)
            for ws in disconnected:
                self.disconnect(ws, room=room)
            if targets:
                logger.info("WS broadcast: type=%s room=%s sent=%d", event_type_or_data, room, len(targets) - len(disconnected))

    async def send_personal(self, websocket: WebSocket, event_type: str, data: dict):
        """Отправить событие одному клиенту."""
        try:
            await websocket.send_text(json.dumps({
                "type": event_type,
                "data": data,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }))
        except Exception:
            self._global.discard(websocket)


# Singleton
ws_manager = ConnectionManager()


# === Helper functions for broadcasting from routes ===

async def notify_new_ad(ad_number: str, aircraft_types: list, compliance_type: str):
    """Уведомление о новой ДЛГ."""
    if compliance_type == "mandatory":
        await ws_manager.broadcast("ad_new_mandatory", {
            "ad_number": ad_number,
            "aircraft_types": aircraft_types,
            "severity": "critical",
            "message": f"⚠️ Новая обязательная ДЛГ: {ad_number}",
        })


async def notify_critical_defect(aircraft_reg: str, description: str, defect_id: str):
    """Уведомление о критическом дефекте."""
    await ws_manager.broadcast("defect_critical", {
        "aircraft_reg": aircraft_reg,
        "description": description[:100],
        "defect_id": defect_id,
        "severity": "critical",
        "message": f"🔴 Критический дефект: {aircraft_reg}",
    })


async def notify_wo_aog(wo_number: str, aircraft_reg: str):
    """Уведомление о наряде AOG."""
    await ws_manager.broadcast("wo_aog", {
        "wo_number": wo_number,
        "aircraft_reg": aircraft_reg,
        "severity": "critical",
        "message": f"🔴 AOG: {aircraft_reg} — наряд {wo_number}",
    })


async def notify_wo_closed(wo_number: str, aircraft_reg: str, crs_by: str):
    """Уведомление о закрытии наряда с CRS."""
    await ws_manager.broadcast("wo_closed_crs", {
        "wo_number": wo_number,
        "aircraft_reg": aircraft_reg,
        "crs_signed_by": crs_by,
        "message": f"✅ CRS: {aircraft_reg} — наряд {wo_number}",
    })


async def notify_life_limit_critical(component: str, serial: str, remaining: dict):
    """Уведомление об исчерпании ресурса."""
    await ws_manager.broadcast("life_limit_critical", {
        "component": component,
        "serial_number": serial,
        "remaining": remaining,
        "severity": "critical",
        "message": f"⏱️ КРИТИЧЕСКИЙ РЕСУРС: {component} S/N {serial}",
    })


def make_notification(event: str, entity_type: str, entity_id: str, **extra: Any) -> dict:
    """Payload для отправки по WebSocket (broadcast / send_to_org)."""
    return {"event": event, "entity_type": entity_type, "entity_id": entity_id, **extra}
