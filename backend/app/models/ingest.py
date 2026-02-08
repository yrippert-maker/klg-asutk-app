from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class IngestJobLog(Base, TimestampMixin):
    __tablename__ = "ingest_job_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    source_system: Mapped[str] = mapped_column(String(128), nullable=False)
    job_name: Mapped[str] = mapped_column(String(128), nullable=False)
    started_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, doc="success|failed|partial")
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
