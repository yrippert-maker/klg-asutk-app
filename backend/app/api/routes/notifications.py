from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Notification
from app.schemas.notification import NotificationOut

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=list[NotificationOut])
def list_my_notifications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return (
        db.query(Notification)
        .filter(Notification.recipient_user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
from fastapi import HTTPException

@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()

    if not n:
        raise HTTPException(status_code=404, detail="Not found")
    if n.recipient_user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    n.is_read = True
    db.commit()
    db.refresh(n)
    return n
