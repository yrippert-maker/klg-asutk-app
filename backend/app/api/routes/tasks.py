from app.schemas.tasks import TaskOut
"""Tasks API — unified task view across entities."""
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.deps import get_current_user
from app.api.helpers import is_authority
from app.models.cert_application import CertApplication

router = APIRouter(tags=["tasks"])


@router.get("/tasks", response_model=List[TaskOut])
def list_tasks(state: str = Query(default="open"), db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(CertApplication)
    if not is_authority(user) and user.organization_id:
        q = q.filter(CertApplication.applicant_org_id == user.organization_id)
    if state == "open":
        q = q.filter(CertApplication.status.in_(["submitted", "under_review", "remarks"]))
    now = datetime.now(timezone.utc)
    return [
        TaskOut(entity_type="cert_application", entity_id=a.id, title=f"Заявка №{a.number}",
                status=a.status, due_at=a.remarks_deadline_at,
                priority="high" if a.remarks_deadline_at and a.remarks_deadline_at <= now else "normal",
                updated_at=a.updated_at)
        for a in q.order_by(CertApplication.updated_at.desc()).limit(100).all()
    ]
