"""Dashboard stats API — tenant-aware aggregation."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_user
from app.api.helpers import is_operator, is_authority
from app.db.session import get_db
from app.models import Aircraft, RiskAlert, Organization, Audit

router = APIRouter(tags=["stats"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    org_filter = user.organization_id if is_operator(user) else None

    # Aircraft
    ac_q = db.query(Aircraft)
    if org_filter: ac_q = ac_q.filter(Aircraft.operator_id == org_filter)
    ac_total = ac_q.count()
    sm = dict(ac_q.with_entities(Aircraft.current_status, func.count(Aircraft.id)).group_by(Aircraft.current_status).all())
    active = sm.get("in_service", 0) + sm.get("active", 0)

    # Risks (unresolved)
    rq = db.query(RiskAlert).filter(RiskAlert.is_resolved == False)
    if org_filter: rq = rq.join(Aircraft).filter(Aircraft.operator_id == org_filter)
    risk_total = rq.count()
    rm = dict(rq.with_entities(RiskAlert.severity, func.count(RiskAlert.id)).group_by(RiskAlert.severity).all())

    # Audits
    aq = db.query(Audit)
    if org_filter: aq = aq.join(Aircraft, Audit.aircraft_id == Aircraft.id).filter(Aircraft.operator_id == org_filter)

    # Orgs
    oq = db.query(Organization)
    if not is_authority(user) and org_filter: oq = oq.filter(Organization.id == org_filter)

    return {
        "aircraft": {"total": ac_total, "active": active, "maintenance": sm.get("maintenance", 0), "storage": sm.get("storage", 0)},
        "risks": {"total": risk_total, "critical": rm.get("critical", 0), "high": rm.get("high", 0), "medium": rm.get("medium", 0), "low": rm.get("low", 0)},
        "audits": {"current": aq.filter(Audit.status == "in_progress").count(), "upcoming": aq.filter(Audit.status == "draft").count(), "completed": aq.filter(Audit.status == "completed").count()},
        "organizations": {"total": oq.count()},
    }
