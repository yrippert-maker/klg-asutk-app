from pydantic import BaseModel, Field

from app.schemas.common import TimestampOut


class AircraftTypeOut(TimestampOut):
    id: str
    manufacturer: str
    model: str


class AircraftTypeCreate(BaseModel):
    manufacturer: str
    model: str


class AircraftCreate(BaseModel):
    registration_number: str = Field(..., examples=["RA-89001"], description="Регистрационный номер ВС")
    aircraft_type_id: str = Field(..., description="ID типа воздушного судна")
    operator_id: str | None = Field(
        default=None,
        description="Operator organization ID. In ASU TK variant, normally inferred from user's organization.",
    )
    drawing_numbers: str | None = Field(default=None, description="Чертежные номера основных изделий (через запятую)")
    work_completion_date: str | None = Field(default=None, description="Дата выполненных работ (YYYY-MM-DD)")


class AircraftUpdate(BaseModel):
    registration_number: str | None = None
    aircraft_type_id: str | None = None
    drawing_numbers: str | None = None
    work_completion_date: str | None = None


class AircraftOut(TimestampOut):
    id: str
    registration_number: str
    aircraft_type: AircraftTypeOut | None = None
    operator_id: str
    operator_name: str | None = None  # Название организации-оператора
    serial_number: str | None = None  # Серийный номер ВС
    manufacture_date: str | None = None  # Дата производства
    first_flight_date: str | None = None  # Дата первого полета
    total_time: float | None = None  # Общий налет в часах
    total_cycles: int | None = None  # Общее количество циклов
    current_status: str | None = None  # Текущий статус
    configuration: str | None = None  # Конфигурация ВС
    drawing_numbers: str | None = None
    work_completion_date: str | None = None