"""Pydantic-схемы для предупреждений о рисках."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RiskAlertOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    aircraft_id: Optional[str] = None
    severity: str
    title: str
    message: Optional[str] = None
    due_at: Optional[datetime] = None
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
