"""Audit events API — now uses real AuditLog table."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.helpers import is_authority, paginate_query
from app.db.session import get_db
from app.models.audit_log import AuditLog

router = APIRouter(tags=["audit"])


@router.get("/audit/events", dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def list_audit_events(
    entity_type: str | None = Query(None), entity_id: str | None = Query(None),
    user_id: str | None = Query(None), action: str | None = Query(None),
    page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(AuditLog)
    if entity_type: q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id: q = q.filter(AuditLog.entity_id == entity_id)
    if user_id: q = q.filter(AuditLog.user_id == user_id)
    if action: q = q.filter(AuditLog.action == action)
    if not is_authority(user): q = q.filter(AuditLog.organization_id == user.organization_id)
    q = q.order_by(AuditLog.created_at.desc())
    return paginate_query(q, page, per_page)
