"""API для агрегированной статистики дашборда."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Aircraft, RiskAlert, Organization, Audit

router = APIRouter(tags=["stats"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Агрегированная статистика для дашборда."""
    org_filter = user.organization_id if user.role.startswith("operator") else None

    # Aircraft
    ac_q = db.query(Aircraft)
    if org_filter:
        ac_q = ac_q.filter(Aircraft.operator_id == org_filter)
    aircraft_total = ac_q.count()
    ac_status = ac_q.with_entities(Aircraft.current_status, func.count(Aircraft.id)).group_by(Aircraft.current_status).all()
    sm = {str(s or "unknown"): c for s, c in ac_status}
    active = sm.get("in_service", 0) + sm.get("active", 0)
    maintenance = sm.get("maintenance", 0)
    storage = sm.get("storage", 0)

    # Risk alerts (unresolved)
    rq = db.query(RiskAlert).filter(RiskAlert.is_resolved == False)
    if org_filter:
        rq = rq.join(Aircraft, RiskAlert.aircraft_id == Aircraft.id).filter(Aircraft.operator_id == org_filter)
    risk_total = rq.count()
    r_sev = rq.with_entities(RiskAlert.severity, func.count(RiskAlert.id)).group_by(RiskAlert.severity).all()
    rm = {str(s or "medium"): c for s, c in r_sev}
    critical, high = rm.get("critical", 0), rm.get("high", 0)
    medium, low = rm.get("medium", 0), rm.get("low", 0)

    # Audits
    aq = db.query(Audit)
    if org_filter:
        aq = aq.join(Aircraft, Audit.aircraft_id == Aircraft.id).filter(Aircraft.operator_id == org_filter)
    current = aq.filter(Audit.status == "in_progress").count()
    upcoming = aq.filter(Audit.status == "draft").count()
    completed = aq.filter(Audit.status == "completed").count()

    # Organizations
    oq = db.query(Organization)
    if user.role not in {"admin", "authority_inspector"} and org_filter:
        oq = oq.filter(Organization.id == org_filter)
    org_total = oq.count()

    return {
        "aircraft": {"total": aircraft_total, "active": active, "maintenance": maintenance, "storage": storage},
        "risks": {"total": risk_total, "critical": critical, "high": high, "medium": medium, "low": low},
        "audits": {"current": current, "upcoming": upcoming, "completed": completed},
        "organizations": {"total": org_total, "operators": org_total, "mro": 0},
    }
