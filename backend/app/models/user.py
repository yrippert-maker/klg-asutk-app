from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin, uuid4_str


class User(Base, TimestampMixin):
    """Local projection of a user from ASU TK-IB.

    In production, user data should be mastered by IB, and KLG stores
    minimal attributes for caching and ownership logic.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid4_str)
    external_subject: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        String(64), nullable=False, doc="admin|authority_inspector|operator_user|operator_manager|mro_user|mro_manager"
    )
    organization_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
