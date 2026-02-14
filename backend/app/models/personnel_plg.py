from datetime import datetime, date
"""
ORM модели: Персонал ПЛГ — специалисты, аттестации, квалификации.
Соответствует миграции 005_personnel_plg.sql.
ВК РФ ст. 52-54; ФАП-147; EASA Part-66.
"""
from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Numeric, Boolean, Date
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class PLGSpecialist(Base, TimestampMixin):
    """Специалист по ПЛГ (ФАП-147; EASA Part-66)."""
    __tablename__ = "plg_specialists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    organization_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    personnel_number: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(10), nullable=False, doc="A/B1/B2/B3/C (Part-66) or I/II/III (ФАП-147)")
    specializations: Mapped[dict | None] = mapped_column(JSONB, default=list, doc="Типы ВС")
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_issued: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    license_expires: Mapped[datetime | None] = mapped_column(Date, nullable=True, index=True)
    medical_certificate_expires: Mapped[datetime | None] = mapped_column(Date, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    attestations = relationship("PLGAttestation", back_populates="specialist", cascade="all, delete-orphan")
    qualifications = relationship("PLGQualification", back_populates="specialist", cascade="all, delete-orphan")

    organization = relationship("Organization", foreign_keys=[organization_id])


class PLGAttestation(Base, TimestampMixin):
    """Аттестация персонала ПЛГ (ФАП-147 п.17; EASA Part-66.A.25/30)."""
    __tablename__ = "plg_attestations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    specialist_id: Mapped[str] = mapped_column(String(36), ForeignKey("plg_specialists.id", ondelete="CASCADE"), nullable=False, index=True)
    attestation_type: Mapped[str] = mapped_column(String(30), nullable=False, doc="initial/periodic/extraordinary/type_rating")
    program_id: Mapped[str] = mapped_column(String(50), nullable=False)
    program_name: Mapped[str] = mapped_column(String(300), nullable=False)
    training_center: Mapped[str | None] = mapped_column(String(300), nullable=True)
    date_start: Mapped[datetime] = mapped_column(Date, nullable=False)
    date_end: Mapped[datetime] = mapped_column(Date, nullable=False)
    hours_theory: Mapped[float] = mapped_column(Numeric(6, 1), default=0)
    hours_practice: Mapped[float] = mapped_column(Numeric(6, 1), default=0)
    exam_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    result: Mapped[str] = mapped_column(String(20), nullable=False, doc="passed/failed/conditional")
    certificate_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    certificate_valid_until: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    examiner_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    specialist = relationship("PLGSpecialist", back_populates="attestations")


class PLGQualification(Base, TimestampMixin):
    """Повышение квалификации (ФАП-145 п.A.35; EASA Part-66.A.40)."""
    __tablename__ = "plg_qualifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    specialist_id: Mapped[str] = mapped_column(String(36), ForeignKey("plg_specialists.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id: Mapped[str] = mapped_column(String(50), nullable=False)
    program_name: Mapped[str] = mapped_column(String(300), nullable=False)
    program_type: Mapped[str] = mapped_column(String(30), nullable=False)
    training_center: Mapped[str | None] = mapped_column(String(300), nullable=True)
    date_start: Mapped[datetime] = mapped_column(Date, nullable=False)
    date_end: Mapped[datetime] = mapped_column(Date, nullable=False)
    hours_total: Mapped[float] = mapped_column(Numeric(6, 1), default=0)
    result: Mapped[str] = mapped_column(String(20), default="passed")
    certificate_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    next_due: Mapped[datetime | None] = mapped_column(Date, nullable=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    specialist = relationship("PLGSpecialist", back_populates="qualifications")
