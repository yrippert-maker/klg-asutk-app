from datetime import datetime, date
"""
ORM модели: Наряды на ТО (Work Orders).
ФАП-145 п.A.50-65; EASA Part-145; ICAO Annex 6 Part I 8.7.
"""
from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Numeric, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class WorkOrder(Base, TimestampMixin):
    """Наряд на ТО (ФАП-145 п.A.50-65; EASA Part-145)."""
    __tablename__ = "work_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    wo_number: Mapped[str] = mapped_column(String(50), nullable=False)
    aircraft_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=True)
    aircraft_reg: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    wo_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ata_chapters: Mapped[dict | None] = mapped_column(JSONB, default=list)
    related_ad_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("ad_directives.id"), nullable=True)
    related_sb_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("service_bulletins.id"), nullable=True)
    related_defect_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    maintenance_program_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal", index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    planned_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    planned_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_manhours: Mapped[float] = mapped_column(Numeric(8, 1), default=0)
    actual_manhours: Mapped[float | None] = mapped_column(Numeric(8, 1), nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(200), nullable=True)
    parts_required: Mapped[dict | None] = mapped_column(JSONB, default=list)
    parts_used: Mapped[dict | None] = mapped_column(JSONB, default=list)
    findings: Mapped[str | None] = mapped_column(Text, nullable=True)
    crs_signed_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    crs_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])
    related_ad = relationship("ADDirective", foreign_keys=[related_ad_id])
    related_sb = relationship("ServiceBulletin", foreign_keys=[related_sb_id])
