"""
Модели данных с Pydantic v2
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class AircraftBase(BaseModel):
    """Базовая модель воздушного судна"""
    registration_number: str = Field(..., description="Регистрационный номер")
    serial_number: Optional[str] = None
    aircraft_type: Optional[str] = None
    operator: Optional[str] = None
    status: Optional[str] = "Активен"
    flight_hours: Optional[int] = 0


class AircraftCreate(AircraftBase):
    """Модель для создания ВС"""
    pass


class AircraftUpdate(BaseModel):
    """Модель для обновления ВС"""
    serial_number: Optional[str] = None
    aircraft_type: Optional[str] = None
    operator: Optional[str] = None
    status: Optional[str] = None
    flight_hours: Optional[int] = None


class Aircraft(AircraftBase):
    """Полная модель ВС"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AircraftEvent(BaseModel):
    """Событие изменения ВС для streaming"""
    event_type: str = Field(..., description="Тип события: created, updated, deleted")
    aircraft_id: int
    registration_number: str
    timestamp: datetime = Field(default_factory=datetime.now)
    data: dict = Field(default_factory=dict)
