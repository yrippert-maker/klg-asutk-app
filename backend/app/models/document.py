from datetime import datetime, date
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class Attachment(Base, TimestampMixin):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    owner_kind: Mapped[str] = mapped_column(String(32), nullable=False, doc="cert_application|aircraft|inspection|..."
    )
    owner_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    uploaded_by_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
