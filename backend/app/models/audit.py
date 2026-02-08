"""
Модели для чек-листов, аудитов (проверок) и находок (findings).

- ChecklistTemplate / ChecklistItem — шаблоны чек-листов по ФАП-М, регламентам и т.п.
- Audit — проведение проверки по шаблону (привязка к ВС).
- AuditResponse — ответ по пункту чек-листа (соответствует / не соответствует / не применимо).
- Finding — несоответствие, создаётся при ответе «не соответствует».
"""

from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class ChecklistTemplate(Base, TimestampMixin):
    """Шаблон чек-листа (версионируемый)."""
    __tablename__ = "checklist_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="ФАП-М, ATA, форма приложения и т.п.")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ChecklistItem(Base, TimestampMixin):
    """Пункт чек-листа в шаблоне."""
    __tablename__ = "checklist_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    template_id: Mapped[str] = mapped_column(String(36), ForeignKey("checklist_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    template = relationship("ChecklistTemplate", backref="items")

    code: Mapped[str] = mapped_column(String(32), nullable=False, doc="Код пункта (ATA, № формы и т.п.)")
    text: Mapped[str] = mapped_column(Text, nullable=False, doc="Текст требования")
    domain: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Audit(Base, TimestampMixin):
    """Проверка (аудит) по чек-листу, привязанная к ВС."""
    __tablename__ = "audits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    template_id: Mapped[str] = mapped_column(String(36), ForeignKey("checklist_templates.id"), nullable=False, index=True)
    template = relationship("ChecklistTemplate")
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft", doc="draft | in_progress | completed")
    planned_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    inspector_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditResponse(Base, TimestampMixin):
    """Ответ по пункту чек-листа в рамках проверки."""
    __tablename__ = "audit_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    audit_id: Mapped[str] = mapped_column(String(36), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True)
    audit = relationship("Audit", backref="responses")
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("checklist_items.id"), nullable=False, index=True)
    item = relationship("ChecklistItem")

    answer: Mapped[str] = mapped_column(String(32), nullable=False, doc="compliant | non_compliant | not_applicable")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_attachment_ids: Mapped[str | None] = mapped_column(String(512), nullable=True, doc="ID вложений через запятую")


class Finding(Base, TimestampMixin):
    """Находка (несоответствие), создаётся при ответе «не соответствует»."""
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    audit_id: Mapped[str] = mapped_column(String(36), ForeignKey("audits.id", ondelete="CASCADE"), nullable=False, index=True)
    audit = relationship("Audit", backref="findings")
    response_id: Mapped[str] = mapped_column(String(36), ForeignKey("audit_responses.id", ondelete="SET NULL"), nullable=True, index=True)
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("checklist_items.id"), nullable=False, index=True)
    item = relationship("ChecklistItem")

    severity: Mapped[str] = mapped_column(String(32), nullable=False, default="high", doc="low | medium | high | critical")
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open", doc="open | in_progress | closed")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
