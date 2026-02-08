"""
Модели для отслеживания технического обслуживания согласно ТЗ.

Соответствует формам из ТЗ:
- Статус выполненного технического обслуживания
- Статус компонентов с ограниченным межремонтным ресурсом/сроком службы (LLP, HT)
- Комплектующие изделия с ограниченным ресурсом (шасси)
"""

from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class MaintenanceTask(Base, TimestampMixin):
    """Статус выполненного технического обслуживания.
    
    Соответствует форме из ТЗ: Статус выполненного технического обслуживания.
    """
    __tablename__ = "maintenance_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    ata_code: Mapped[str] = mapped_column(String(16), nullable=False, doc="Код ATA")
    task_number: Mapped[str] = mapped_column(String(32), nullable=False, doc="Номер карты программы ТО")
    rev: Mapped[str | None] = mapped_column(String(16), nullable=True, doc="Ревизия карты программы ТО")
    references: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Ссылки")
    type: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Тип карты программы ТО")
    status: Mapped[str] = mapped_column(String(32), nullable=False, doc="Статус")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Заголовок карты программы ТО")
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Примечания к карте программы ТО")
    threshold: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Порог выполнения карты")
    interval: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Интервал выполнения карты")
    last_accomplished: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата предыдущего выполнения карты")
    next_due: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата планируемого выполнения карты")
    time_remaining: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Остаток до наступления Dead-line по таску")


class LimitedLifeComponent(Base, TimestampMixin):
    """Компоненты с ограниченным межремонтным ресурсом/сроком службы (LLP, HT).
    
    Соответствует форме из ТЗ: Статус компонентов с ограниченным межремонтным ресурсом/сроком службы (LLP, HT).
    """
    __tablename__ = "limited_life_components"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    ata_code: Mapped[str] = mapped_column(String(16), nullable=False, doc="Код ATA")
    part_number: Mapped[str] = mapped_column(String(64), nullable=False, doc="Партийный номер компонента")
    serial_number: Mapped[str] = mapped_column(String(64), nullable=False, doc="Серийный номер компонента")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Описание события TO")
    current_status: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Текущий статус компонента")
    position: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Позиция компонента на ВС")
    release_no: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Номер релиза/номер ярлыка")
    install_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата установки")
    tah_inst: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Значение счётчика FH компонента на момент установки")
    tac_inst: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Значение счётчика FC компонента на момент установки")
    requirement_title: Mapped[str | None] = mapped_column(String(255), nullable=True, doc="Наименование требования")
    requirement_type: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Тип требования")
    interval: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Интервал выполнения требования")
    expected_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Ожидаемая дата выполнения требования")
    to_go: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Остаток до следствия")
    tsn: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Текущее значение счётчика FH компонента")
    csn: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Текущее значение счётчика FC компонента")


class LandingGearComponent(Base, TimestampMixin):
    """Комплектующие изделия с ограниченным ресурсом (шасси).
    
    Соответствует форме из ТЗ: Комплектующие изделия с ограниченным ресурсом (шасси).
    """
    __tablename__ = "landing_gear_components"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    aircraft_id: Mapped[str] = mapped_column(String(36), ForeignKey("aircraft.id"), nullable=False, index=True)
    aircraft = relationship("Aircraft", foreign_keys=[aircraft_id])

    ata_code: Mapped[str] = mapped_column(String(16), nullable=False, doc="Код ATA")
    part_number: Mapped[str] = mapped_column(String(64), nullable=False, doc="Партийный номер компонента")
    serial_number: Mapped[str] = mapped_column(String(64), nullable=False, doc="Серийный номер компонента")
    description: Mapped[str | None] = mapped_column(Text, nullable=True, doc="Описание события технического обслуживания")
    position: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Позиция компонента на ВС")
    release_no: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Номер релиза/номер ярлыка")
    install_date: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дата установки")
    tsn: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Текущее значение счётчика FH компонента")
    csn: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Текущее значение счётчика FC компонента")
    requirement: Mapped[str | None] = mapped_column(String(255), nullable=True, doc="Требование по обслуживанию")
    dim: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Единица изменения")
    due_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Дедлайн")
    interval: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Интервал выполнения требования")
    tsr: Mapped[str | None] = mapped_column(String(32), nullable=True, doc="Значение, прошедшее с момента крайнего выполнения требования")
    expected: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True, doc="Ожидаемая дата")
    to_go: Mapped[str | None] = mapped_column(String(64), nullable=True, doc="Остаток до наступления требования")
