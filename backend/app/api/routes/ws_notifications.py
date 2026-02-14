"""
WebSocket endpoint for realtime notifications.
Multi-user: each connection is scoped to user_id + org_id from JWT.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.ws_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/notifications")
async def ws_notifications(
    ws: WebSocket,
    user_id: str = Query(...),
    org_id: str | None = Query(default=None),
):
    """
    WebSocket endpoint for receiving realtime notifications.
    
    Connect: ws://host/api/v1/ws/notifications?user_id=xxx&org_id=yyy
    
    Messages are JSON: {type, entity_type, entity_id, timestamp, ...}
    """
    await ws_manager.connect(ws, user_id, org_id)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(ws, user_id, org_id)
