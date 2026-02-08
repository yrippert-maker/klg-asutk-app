from app.schemas.common import TimestampOut


class AttachmentOut(TimestampOut):
    id: str
    owner_kind: str
    owner_id: str
    filename: str
    content_type: str | None
    uploaded_by_user_id: str
