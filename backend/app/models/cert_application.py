from datetime import datetime

from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class CertApplicationStatus:
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    REMARKS = "remarks"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"  # no resubmission within deadline


class CertApplication(Base, TimestampMixin):
    __tablename__ = "cert_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)

    applicant_org_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=False)
    applicant_org = relationship("Organization", foreign_keys=[applicant_org_id])

    created_by_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    number: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=CertApplicationStatus.DRAFT)

    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remarks_deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    subject: Mapped[str] = mapped_column(String(255), nullable=False, default="Сертификация организации по ТО")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class ApplicationRemark(Base, TimestampMixin):
    __tablename__ = "application_remarks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("cert_applications.id"), nullable=False, index=True)
    application = relationship(CertApplication)

    author_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    author = relationship("User", foreign_keys=[author_user_id])

    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(nullable=False, default=False)
