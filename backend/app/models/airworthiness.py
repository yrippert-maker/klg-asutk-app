"""
Модели для управления лётной годностью согласно требованиям ИКАО Annex 8.

Соответствует требованиям:
- ИКАО Annex 8 (Airworthiness of Aircraft)
- EASA Part M (Continuing Airworthiness)
- Лучшие практики индустрии
"""

from sqlalchemy import String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class AirworthinessCertificate(Base, TimestampMixin):
    """Документ лётной годности (ДЛГ).
    
    Соответствует требованиям ИКАО Annex 8: каждый ВС должен иметь действующий
    сертификат лётной годности.
    """
    __tablename__ = "airworthiness_certificates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    certificate_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False, doc="Номер сертификата")
    certificate_type: Mapped[str] = mapped_column(String(32), nullable=False, doc="Тип сертификата (standard, export, special и т.д.)")
    
    issue_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, doc="Дата выдачи")
    expiry_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата истечения (если применимо)")
    
    issuing_authority: Mapped[str] = mapped_column(String(128), nullable=False, doc="Орган, выдавший сертификат")
    issued_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, doc="Пользователь, выдавший сертификат")
    issued_by = relationship("User", foreign_keys=[issued_by_user_id])
    
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="valid", doc="Статус (valid, expired, suspended, revoked)")
    
    conditions: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Условия действия сертификата")
    limitations: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Ограничения")
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Примечания")
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, doc="Активен ли сертификат")


class AircraftHistory(Base, TimestampMixin):
    """История событий воздушного судна.
    
    Отслеживает все значимые события в жизненном цикле ВС:
    обслуживания, модификации, инспекции, инциденты.
    """
    __tablename__ = "aircraft_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    event_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True, doc="Тип события (maintenance, inspection, modification, incident, status_change)")
    event_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, index=True, doc="Дата события")
    
    description: Mapped[str] = mapped_column(Text, nullable=False, doc="Описание события")
    
    performed_by_org_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True, doc="Организация, выполнившая работу")
    performed_by_org = relationship("Organization", foreign_keys=[performed_by_org_id])
    
    performed_by_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, doc="Специалист, выполнивший работу")
    performed_by_user = relationship("User", foreign_keys=[performed_by_user_id])
    
    # Счетчики на момент события
    hours_at_event: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Налет на момент события (TTSN)")
    cycles_at_event: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Циклы на момент события (TCSN)")
    
    compliance_status: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Статус соответствия требованиям")
    reference_documents: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Ссылки на документы (через запятую или JSON)")
    
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Дополнительные примечания")
