from datetime import datetime, date
"""
ORM модели: Контроль ЛГ — AD, SB, Life Limits, Maintenance Programs, Components.
Соответствует миграции 006_airworthiness_core.sql.
ВК РФ ст. 36-37.2; ФАП-148; EASA Part-M; ICAO Annex 6/8.
"""
from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Numeric, Boolean, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class ADDirective(Base, TimestampMixin):
    """Директива лётной годности (ВК РФ ст. 37; ФАП-148 п.4.3; EASA Part-M.A.301)."""
    __tablename__ = "ad_directives"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    issuing_authority: Mapped[str] = mapped_column(String(50), default="FATA")
    aircraft_types: Mapped[dict | None] = mapped_column(JSONB, default=list)
    ata_chapter: Mapped[str | None] = mapped_column(String(10), nullable=True)
    effective_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    compliance_type: Mapped[str] = mapped_column(String(20), default="mandatory")
    compliance_deadline: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    repetitive: Mapped[bool] = mapped_column(Boolean, default=False)
    repetitive_interval_hours: Mapped[float | None] = mapped_column(Numeric(8, 1), nullable=True)
    repetitive_interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_parts: Mapped[dict | None] = mapped_column(JSONB, default=list)
    supersedes: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)
    compliance_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    compliance_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class ServiceBulletin(Base, TimestampMixin):
    """Сервисный бюллетень (ФАП-148 п.4.5; EASA Part-21.A.3B)."""
    __tablename__ = "service_bulletins"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    number: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(200), nullable=False)
    aircraft_types: Mapped[dict | None] = mapped_column(JSONB, default=list)
    ata_chapter: Mapped[str | None] = mapped_column(String(10), nullable=True)
    category: Mapped[str] = mapped_column(String(20), default="recommended")
    issued_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    compliance_deadline: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    estimated_manhours: Mapped[float | None] = mapped_column(Numeric(6, 1), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_ad_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("ad_directives.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)
    incorporation_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    incorporation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    related_ad = relationship("ADDirective", foreign_keys=[related_ad_id])


class LifeLimit(Base, TimestampMixin):
    """Ресурсы и сроки службы (ФАП-148 п.4.2; EASA Part-M.A.302)."""
    __tablename__ = "life_limits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=True, index=True)
    component_name: Mapped[str] = mapped_column(String(200), nullable=False)
    part_number: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False)
    limit_type: Mapped[str] = mapped_column(String(20), nullable=False)
    calendar_limit_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flight_hours_limit: Mapped[float | None] = mapped_column(Numeric(10, 1), nullable=True)
    cycles_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_hours: Mapped[float] = mapped_column(Numeric(10, 1), default=0)
    current_cycles: Mapped[int] = mapped_column(Integer, default=0)
    install_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    last_overhaul_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])


class MaintenanceProgram(Base, TimestampMixin):
    """Программа ТО (ФАП-148 п.3; ICAO Annex 6 Part I 8.3)."""
    __tablename__ = "maintenance_programs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    aircraft_type: Mapped[str] = mapped_column(String(100), nullable=False)
    revision: Mapped[str] = mapped_column(String(20), default="Rev.0")
    approved_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    approval_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    tasks: Mapped[dict | None] = mapped_column(JSONB, default=list)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class AircraftComponent(Base, TimestampMixin):
    """Карточка компонента (ФАП-145 п.A.42; EASA Part-M.A.501)."""
    __tablename__ = "aircraft_components"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    part_number: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=False)
    ata_chapter: Mapped[str | None] = mapped_column(String(10), nullable=True)
    manufacturer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    install_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    install_position: Mapped[str | None] = mapped_column(String(200), nullable=True)
    current_hours: Mapped[float] = mapped_column(Numeric(10, 1), default=0)
    current_cycles: Mapped[int] = mapped_column(Integer, default=0)
    condition: Mapped[str] = mapped_column(String(20), default="serviceable", index=True)
    certificate_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    certificate_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_shop_visit: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    next_overhaul_due: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])
