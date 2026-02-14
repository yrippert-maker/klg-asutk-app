"""Notifications API — refactored: pagination."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.helpers import paginate_query
from app.api.deps import get_db
from app.models import Notification
from app.schemas.notification import NotificationOut

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
def list_my_notifications(
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(Notification).filter(Notification.recipient_user_id == user.id)
    if unread_only: q = q.filter(Notification.is_read == False)
    q = q.order_by(Notification.created_at.desc())
    return paginate_query(q, page, per_page)


@router.post("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n: raise HTTPException(404, "Not found")
    if n.recipient_user_id != user.id: raise HTTPException(403, "Forbidden")
    n.is_read = True; db.commit(); db.refresh(n)
    return n


@router.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(Notification).filter(Notification.recipient_user_id == user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "ok"}
