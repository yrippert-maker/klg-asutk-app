"""Risk alerts API — refactored: pagination, audit, DRY."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.services.email_service import email_service
from app.api.helpers import audit, filter_by_org, paginate_query
from app.api.deps import get_db
from app.models import RiskAlert, Aircraft
from app.schemas.risk_alert import RiskAlertOut
from app.services.risk_scanner import scan_risks

router = APIRouter(tags=["risk-alerts"])


@router.get("/risk-alerts")
def list_risk_alerts(
    aircraft_id: str | None = Query(None), severity: str | None = Query(None),
    resolved: bool | None = Query(None),
    page: int = Query(1, ge=1), per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(RiskAlert)
    if aircraft_id: q = q.filter(RiskAlert.aircraft_id == aircraft_id)
    if severity: q = q.filter(RiskAlert.severity == severity)
    if resolved is not None: q = q.filter(RiskAlert.is_resolved == resolved)
    q = filter_by_org(q.join(Aircraft), Aircraft, user)
    q = q.order_by(RiskAlert.due_at.asc(), RiskAlert.severity.desc())
    result = paginate_query(q, page, per_page)
    result["items"] = [RiskAlertOut.model_validate(a) for a in result["items"]]
    return result


@router.post("/risk-alerts/scan", dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def trigger_risk_scan(db: Session = Depends(get_db), user=Depends(get_current_user)):
    created = scan_risks(db)
    audit(db, user, "create", "risk_alert", description=f"Risk scan: {created} alerts")
    db.commit()
    return {"created": created}


@router.patch("/risk-alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert: raise HTTPException(404, "Not found")
    alert.is_resolved = True; alert.resolved_at = datetime.now(timezone.utc)
    audit(db, user, "update", "risk_alert", alert_id, description="Resolved")
    db.commit(); db.refresh(alert)
    return RiskAlertOut.model_validate(alert)
