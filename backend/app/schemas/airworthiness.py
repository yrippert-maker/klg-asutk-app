"""
Схемы для управления лётной годностью согласно требованиям ИКАО Annex 8.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import TimestampOut


class AirworthinessCertificateOut(TimestampOut):
    """Схема вывода документа лётной годности."""
    id: str
    aircraft_id: str
    certificate_number: str
    certificate_type: str
    issue_date: datetime
    expiry_date: datetime | None
    issuing_authority: str
    issued_by_user_id: str | None
    status: str
    conditions: str | None
    limitations: str | None
    remarks: str | None
    is_active: bool


class AirworthinessCertificateCreate(BaseModel):
    """Схема создания документа лётной годности."""
    aircraft_id: str = Field(..., description="ID воздушного судна")
    certificate_number: str = Field(..., description="Номер сертификата")
    certificate_type: str = Field(..., description="Тип сертификата (standard, export, special)")
    issue_date: datetime = Field(..., description="Дата выдачи")
    expiry_date: datetime | None = Field(default=None, description="Дата истечения")
    issuing_authority: str = Field(..., description="Орган, выдавший сертификат")
    conditions: str | None = Field(default=None, description="Условия действия сертификата")
    limitations: str | None = Field(default=None, description="Ограничения")
    remarks: str | None = Field(default=None, description="Примечания")


class AirworthinessCertificateUpdate(BaseModel):
    """Схема обновления документа лётной годности."""
    certificate_number: str | None = None
    certificate_type: str | None = None
    issue_date: datetime | None = None
    expiry_date: datetime | None = None
    issuing_authority: str | None = None
    status: str | None = None
    conditions: str | None = None
    limitations: str | None = None
    remarks: str | None = None
    is_active: bool | None = None


class AircraftHistoryOut(TimestampOut):
    """Схема вывода истории событий ВС."""
    id: str
    aircraft_id: str
    event_type: str
    event_date: datetime
    description: str
    performed_by_org_id: str | None
    performed_by_user_id: str | None
    hours_at_event: str | None
    cycles_at_event: str | None
    compliance_status: str | None
    reference_documents: str | None
    notes: str | None


class AircraftHistoryCreate(BaseModel):
    """Схема создания записи истории ВС."""
    aircraft_id: str = Field(..., description="ID воздушного судна")
    event_type: str = Field(..., description="Тип события (maintenance, inspection, modification, incident, status_change)")
    event_date: datetime = Field(..., description="Дата события")
    description: str = Field(..., description="Описание события")
    performed_by_org_id: str | None = Field(default=None, description="ID организации, выполнившей работу")
    performed_by_user_id: str | None = Field(default=None, description="ID специалиста, выполнившего работу")
    hours_at_event: str | None = Field(default=None, description="Налет на момент события (TTSN)")
    cycles_at_event: str | None = Field(default=None, description="Циклы на момент события (TCSN)")
    compliance_status: str | None = Field(default=None, description="Статус соответствия требованиям")
    reference_documents: str | None = Field(default=None, description="Ссылки на документы")
    notes: str | None = Field(default=None, description="Дополнительные примечания")
