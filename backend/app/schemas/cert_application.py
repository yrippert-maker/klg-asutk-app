from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common import TimestampOut


class CertApplicationCreate(BaseModel):
    subject: str = "Сертификация организации по ТО"
    description: str | None = None


class CertApplicationOut(TimestampOut):
    id: str
    number: str
    status: str
    applicant_org_id: str
    applicant_org_name: str | None = None
    created_by_user_id: str
    submitted_at: datetime | None
    remarks_deadline_at: datetime | None
    subject: str
    description: str | None


class RemarkCreate(BaseModel):
    text: str = Field(..., min_length=1)


class RemarkOut(TimestampOut):
    id: str
    application_id: str
    author_user_id: str
    text: str
    is_resolved: bool
