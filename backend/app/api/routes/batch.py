"""
Batch operations API — bulk create/update/delete.
Reduces N+1 API calls for bulk operations.
"""
from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, get_db
from app.api.helpers import audit
from app.models import Aircraft, Organization, RiskAlert

router = APIRouter(prefix="/batch", tags=["batch"])


class BatchDeleteRequest(BaseModel):
    entity_type: str  # aircraft, organizations, risk_alerts
    ids: List[str]


class BatchStatusUpdate(BaseModel):
    entity_type: str
    ids: List[str]
    status: str


ENTITY_MAP = {
    "aircraft": Aircraft,
    "organizations": Organization,
    "risk_alerts": RiskAlert,
}


@router.post(
    "/delete",
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def batch_delete(req: BatchDeleteRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Delete multiple entities in one request."""
    model = ENTITY_MAP.get(req.entity_type)
    if not model:
        return {"error": f"Unknown entity: {req.entity_type}", "deleted": 0}

    deleted = 0
    for eid in req.ids[:100]:  # max 100 per batch
        obj = db.query(model).filter(model.id == eid).first()
        if obj:
            db.delete(obj)
            deleted += 1

    audit(db, user, "batch_delete", req.entity_type,
          description=f"Batch deleted {deleted}/{len(req.ids)} {req.entity_type}")
    db.commit()
    return {"deleted": deleted, "total_requested": len(req.ids)}


@router.post(
    "/status",
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def batch_status_update(req: BatchStatusUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Update status of multiple entities."""
    model = ENTITY_MAP.get(req.entity_type)
    if not model or not hasattr(model, "status"):
        return {"error": f"Unknown entity or no status field: {req.entity_type}", "updated": 0}

    updated = 0
    for eid in req.ids[:100]:
        obj = db.query(model).filter(model.id == eid).first()
        if obj:
            obj.status = req.status
            updated += 1

    audit(db, user, "batch_update", req.entity_type,
          description=f"Batch status→{req.status} for {updated}/{len(req.ids)} {req.entity_type}")
    db.commit()
    return {"updated": updated, "status": req.status}
