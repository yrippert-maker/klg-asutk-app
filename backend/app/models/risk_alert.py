from datetime import datetime, date
"""
Модель для автоматических предупреждений о рисках.

Заполняется сервисом risk_scanner по данным: ТО (сроки, next_due), LLP, шасси,
дефекты (limit_date), сертификаты лётной годности (expiry_date) и т.п.
"""

from sqlalchemy import String, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class RiskAlert(Base, TimestampMixin):
    __tablename__ = "risk_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True, doc="maintenance_task | limited_life | landing_gear | defect_report | airworthiness_certificate")
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    aircraft_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    severity: Mapped[str] = mapped_column(String(32), nullable=False, default="medium", doc="low | medium | high | critical")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
