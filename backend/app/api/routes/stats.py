"""Dashboard stats API — tenant-aware aggregation."""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_user
from app.api.helpers import is_operator, is_authority
from app.api.deps import get_db
from app.models import Aircraft, RiskAlert, Organization, Audit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["stats"])

def _empty_stats():
    return {
        "aircraft": {"total": 0, "active": 0, "maintenance": 0, "storage": 0},
        "risks": {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0},
        "audits": {"current": 0, "upcoming": 0, "completed": 0},
        "organizations": {"total": 0},
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        org_filter = user.organization_id if is_operator(user) else None

        # Aircraft (model uses "status", not "current_status")
        ac_q = db.query(Aircraft).filter(Aircraft.is_active != False)
        if org_filter:
            ac_q = ac_q.filter(Aircraft.operator_id == org_filter)
        ac_total = ac_q.count()
        sm = dict(ac_q.with_entities(Aircraft.status, func.count(Aircraft.id)).group_by(Aircraft.status).all() or [])
        active = sm.get("in_service", 0) + sm.get("active", 0)

        # Risks (unresolved); explicit join for tenant filter
        rq = db.query(RiskAlert).filter(RiskAlert.is_resolved == False)
        rq = rq.outerjoin(Aircraft, RiskAlert.aircraft_id == Aircraft.id)
        if org_filter:
            rq = rq.filter(Aircraft.operator_id == org_filter)
        risk_total = rq.count()
        rm = dict(rq.with_entities(RiskAlert.severity, func.count(RiskAlert.id)).group_by(RiskAlert.severity).all() or [])

        # Audits
        aq = db.query(Audit)
        if org_filter:
            aq = aq.outerjoin(Aircraft, Audit.aircraft_id == Aircraft.id).filter(Aircraft.operator_id == org_filter)
        audits_current = aq.filter(Audit.status == "in_progress").count()
        audits_upcoming = aq.filter(Audit.status == "draft").count()
        audits_completed = aq.filter(Audit.status == "completed").count()

        # Orgs
        oq = db.query(Organization)
        if not is_authority(user) and org_filter:
            oq = oq.filter(Organization.id == org_filter)

        return {
            "aircraft": {"total": ac_total, "active": active, "maintenance": sm.get("maintenance", 0), "storage": sm.get("storage", 0)},
            "risks": {"total": risk_total, "critical": rm.get("critical", 0), "high": rm.get("high", 0), "medium": rm.get("medium", 0), "low": rm.get("low", 0)},
            "audits": {"current": audits_current, "upcoming": audits_upcoming, "completed": audits_completed},
            "organizations": {"total": oq.count()},
        }
    except Exception as e:
        logger.warning("Stats query failed, returning empty: %s", e)
        return _empty_stats()
