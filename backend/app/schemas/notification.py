from app.schemas.common import TimestampOut


class NotificationOut(TimestampOut):
    id: str
    recipient_user_id: str
    title: str
    body: str | None
    is_read: bool
