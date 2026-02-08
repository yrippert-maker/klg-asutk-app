"""
Модели для отслеживания дефектов и повреждений согласно ТЗ.

Соответствует формам из ТЗ:
- Отчет по ремонтам и повреждениям конструкции
- Отчет по дефектам
"""

from sqlalchemy import String, ForeignKey, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class DamageReport(Base, TimestampMixin):
    """Отчет по ремонтам и повреждениям конструкции.
    
    Соответствует форме из ТЗ: Отчет по ремонтам и повреждениям конструкции.
    """
    __tablename__ = "damage_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    item: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Пункт")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Описание")
    chart: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Схема")
    status: Mapped[str] = mapped_column(String(32), nullable=False, doc="Статус")
    component: Mapped[str | None] = mapped_column(String(128), nullable=True, doc="Компонент")
    dta_status: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Оценка допустимости повреждения")
    due_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Статус выполнения")
    wo: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Заказ")
    ata_issue_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата выпуска")
    performed: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Выполнено")
    references: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Ссылки")
    damage_type: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Тип повреждения")
    nature_type: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Характер повреждения")
    dimension: Mapped[str | None] = mapped_column(String(128), nullable=True, doc="Размеры")
    location: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Расположение")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Примечания")
    entry_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Начало")
    entry_sign: Mapped[str | None] = mapped_column(String(128), nullable=True, doc="Подпись (начало)")
    final_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Окончание")
    final_sign: Mapped[str | None] = mapped_column(String(128), nullable=True, doc="Подпись (окончание)")


class DefectReport(Base, TimestampMixin):
    """Отчет по дефектам.
    
    Соответствует форме из ТЗ: Отчет по дефектам.
    """
    __tablename__ = "defect_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    ata_code: Mapped[str] = mapped_column(String(16), nullable=False, doc="Код ATA")
    wo_number: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Номер заказа")
    reference_tlb: Mapped[str | None] = mapped_column(String(128), nullable=True, doc="Ссылка на бортжурнал (TLB, CLB, GLB)")
    report: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Описание события")
    action: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Что сделано")
    mel_cat: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Категория MEL")
    mel_item: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Пункт MEL")
    incident_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата инцидента (UTC)")
    limit_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата ограничения (крайний срок)")
    extended_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Расширенная дата")
    remaining_fh_fc: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Оставшиеся часы полета/циклы полета")
    remaining_time: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Оставшееся время")
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Примечания")
    etops_status: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Статус ETOPS")
