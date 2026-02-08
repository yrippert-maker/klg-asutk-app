from sqlalchemy.orm import Session

from app.models import Notification


def notify(db: Session, recipient_user_id: str, title: str, body: str | None = None) -> Notification:
    n = Notification(recipient_user_id=recipient_user_id, title=title, body=body)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
