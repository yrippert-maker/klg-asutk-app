"""Pydantic-схемы для чек-листов, аудитов и находок."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# --- Checklist ---
class ChecklistItemCreate(BaseModel):
    code: str
    text: str
    domain: Optional[str] = None
    sort_order: int = 0


class ChecklistItemOut(BaseModel):
    id: str
    template_id: str
    code: str
    text: str
    domain: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class ChecklistTemplateCreate(BaseModel):
    name: str
    version: int = 1
    description: Optional[str] = None
    domain: Optional[str] = None
    items: Optional[list[ChecklistItemCreate]] = None


class ChecklistTemplateOut(BaseModel):
    id: str
    name: str
    version: int
    description: Optional[str] = None
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime
    items: Optional[list[ChecklistItemOut]] = None

    class Config:
        from_attributes = True


# --- Audit ---
class AuditCreate(BaseModel):
    template_id: str
    aircraft_id: str
    planned_at: Optional[datetime] = None


class AuditOut(BaseModel):
    id: str
    template_id: str
    aircraft_id: str
    status: str
    planned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditResponseCreate(BaseModel):
    item_id: str
    answer: str = Field(..., pattern="^(compliant|non_compliant|not_applicable)$")
    comment: Optional[str] = None
    evidence_attachment_ids: Optional[str] = None


class AuditResponseOut(BaseModel):
    id: str
    audit_id: str
    item_id: str
    answer: str
    comment: Optional[str] = None
    evidence_attachment_ids: Optional[str] = None

    class Config:
        from_attributes = True


# --- Finding ---
class FindingOut(BaseModel):
    id: str
    audit_id: str
    item_id: str
    severity: str
    risk_score: int
    status: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
