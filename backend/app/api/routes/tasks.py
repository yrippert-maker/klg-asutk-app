
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.cert_application import CertApplication
from app.schemas.tasks import TaskOut

router = APIRouter(tags=["tasks"])


@router.get("/tasks", response_model=List[TaskOut])
def list_tasks(
    state: str = Query(default="open"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(CertApplication)

    if state == "open":
        q = q.filter(CertApplication.status.in_(["submitted", "under_review", "remarks"]))

    apps = q.order_by(CertApplication.updated_at.desc()).all()

    return [
        TaskOut(
            entity_type="cert_application",
            entity_id=a.id,
            title=f"Заявка №{a.number}",
            status=a.status,
            due_at=a.remarks_deadline_at,
            priority="high" if a.remarks_deadline_at and a.remarks_deadline_at <= datetime.utcnow() else "normal",
            updated_at=a.updated_at,
        )
        for a in apps
    ]
