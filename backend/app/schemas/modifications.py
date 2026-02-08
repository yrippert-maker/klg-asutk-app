"""
Схемы для управления модификациями воздушных судов.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import TimestampOut


class AircraftModificationOut(TimestampOut):
    """Схема вывода модификации ВС."""
    id: str
    aircraft_id: str
    modification_number: str
    modification_type: str
    title: str
    description: str | None
    applicable_aircraft_types: str | None
    compliance_required: bool
    compliance_date: datetime | None
    compliance_status: str
    compliance_method: str | None
    performed_date: datetime | None
    performed_by_org_id: str | None
    performed_by_user_id: str | None
    reference_documents: str | None
    remarks: str | None
    deferral_reason: str | None
    deferral_until: datetime | None


class AircraftModificationCreate(BaseModel):
    """Схема создания модификации ВС."""
    aircraft_id: str = Field(..., description="ID воздушного судна")
    modification_number: str = Field(..., description="Номер модификации (AD, SB, STC номер)")
    modification_type: str = Field(..., description="Тип модификации (AD, SB, STC, Service Bulletin)")
    title: str = Field(..., description="Название модификации")
    description: str | None = Field(default=None, description="Описание модификации")
    applicable_aircraft_types: str | None = Field(default=None, description="Типы ВС, к которым применима модификация")
    compliance_required: bool = Field(default=False, description="Обязательна ли модификация")
    compliance_date: datetime | None = Field(default=None, description="Срок выполнения (для обязательных)")
    compliance_method: str | None = Field(default=None, description="Способ выполнения модификации")
    reference_documents: str | None = Field(default=None, description="Ссылки на документы модификации")
    remarks: str | None = Field(default=None, description="Примечания")


class AircraftModificationUpdate(BaseModel):
    """Схема обновления модификации ВС."""
    modification_number: str | None = None
    modification_type: str | None = None
    title: str | None = None
    description: str | None = None
    applicable_aircraft_types: str | None = None
    compliance_required: bool | None = None
    compliance_date: datetime | None = None
    compliance_status: str | None = None
    compliance_method: str | None = None
    performed_date: datetime | None = None
    performed_by_org_id: str | None = None
    performed_by_user_id: str | None = None
    reference_documents: str | None = None
    remarks: str | None = None
    deferral_reason: str | None = None
    deferral_until: datetime | None = None
