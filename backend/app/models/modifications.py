"""
Модели для управления модификациями воздушных судов.

Соответствует требованиям ИКАО Annex 8: отслеживание обязательных модификаций
(AD - Airworthiness Directives, SB - Service Bulletins, STC - Supplemental Type Certificates).
"""

from sqlalchemy import String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class AircraftModification(Base, TimestampMixin):
    """Модификация воздушного судна.
    
    Отслеживает обязательные и необязательные модификации ВС согласно требованиям ИКАО.
    """
    __tablename__ = "aircraft_modifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    modification_number: Mapped[str] = mapped_column(String(64), nullable=False, index=True, doc="Номер модификации (AD, SB, STC номер)")
    modification_type: Mapped[str] = mapped_column(String(32), nullable=False, doc="Тип модификации (AD, SB, STC, Service Bulletin)")
    
    title: Mapped[str] = mapped_column(String(255), nullable=False, doc="Название модификации")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Описание модификации")
    
    # Применимость
    applicable_aircraft_types: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Типы ВС, к которым применима модификация (JSON или текст)")
    
    # Обязательность
    compliance_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, doc="Обязательна ли модификация")
    compliance_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Срок выполнения (для обязательных)")
    
    # Статус выполнения
    compliance_status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending", doc="Статус выполнения (pending, complied, deferred, not_applicable)")
    compliance_method: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Способ выполнения модификации")
    
    # Выполнение
    performed_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата выполнения")
    performed_by_org_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True, doc="Организация, выполнившая модификацию")
    performed_by_org = relationship("Organization", foreign_keys=[performed_by_org_id])
    
    performed_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, doc="Специалист, выполнивший модификацию")
    performed_by_user = relationship("User", foreign_keys=[performed_by_user_id])
    
    # Документы
    reference_documents: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Ссылки на документы модификации")
    
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Примечания")
    
    # Отложенное выполнение (если применимо)
    deferral_reason: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Причина отложения выполнения")
    deferral_until: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Отложено до даты")
