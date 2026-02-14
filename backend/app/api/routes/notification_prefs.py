"""
Настройки уведомлений пользователя.
Позволяет включать/отключать: email, push, WS для разных типов событий.
"""
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional
from app.api.deps import get_current_user

router = APIRouter(prefix="/notification-preferences", tags=["notifications"])

_prefs: dict = {}

class NotificationPrefs(BaseModel):
    ad_mandatory: bool = Field(True, description="Обязательные ДЛГ")
    ad_recommended: bool = Field(False, description="Рекомендательные ДЛГ")
    defect_critical: bool = Field(True, description="Критические дефекты")
    defect_major: bool = Field(True, description="Значительные дефекты")
    defect_minor: bool = Field(False, description="Незначительные дефекты")
    wo_aog: bool = Field(True, description="AOG наряды")
    wo_closed: bool = Field(True, description="Закрытие нарядов (CRS)")
    life_limit_critical: bool = Field(True, description="Критические ресурсы")
    personnel_expiry: bool = Field(True, description="Просрочка квалификации")
    channels_email: bool = Field(True, description="Email уведомления")
    channels_push: bool = Field(False, description="Push уведомления")
    channels_ws: bool = Field(True, description="WebSocket real-time")

@router.get("/")
def get_preferences(user=Depends(get_current_user)):
    uid = getattr(user, 'sub', 'default')
    return _prefs.get(uid, NotificationPrefs().dict())

@router.put("/")
def update_preferences(data: NotificationPrefs, user=Depends(get_current_user)):
    uid = getattr(user, 'sub', 'default')
    _prefs[uid] = data.dict()
    return _prefs[uid]
