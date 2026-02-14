"""
Audit log for multi-tenant tracking: who changed what, when.
Part-M-RU M.A.305-306 compliance: all changes to airworthiness data must be logged.
"""
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import uuid4_str


class AuditLog(Base):
    """Immutable audit trail entry."""
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    
    # Who
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_role: Mapped[str | None] = mapped_column(String(64), nullable=True)
    organization_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    
    # What
    action: Mapped[str] = mapped_column(String(32), nullable=False, index=True, doc="create|update|delete|read|login|export")
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True, doc="Table name / entity type")
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    
    # Details
    changes: Mapped[dict | None] = mapped_column(JSON, nullable=True, doc="JSON diff: {field: {old, new}}")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    
    # When
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
