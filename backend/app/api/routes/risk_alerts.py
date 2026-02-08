"""API для предупреждений о рисках."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import RiskAlert
from app.schemas.risk_alert import RiskAlertOut
from app.services.risk_scanner import scan_risks

router = APIRouter(tags=["risk-alerts"])


@router.get("/risk-alerts", response_model=list[RiskAlertOut])
def list_risk_alerts(
    aircraft_id: str | None = Query(None),
    severity: str | None = Query(None),
    resolved: bool | None = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Список предупреждений о рисках."""
    q = db.query(RiskAlert)
    
    if aircraft_id:
        q = q.filter(RiskAlert.aircraft_id == aircraft_id)
    if severity:
        q = q.filter(RiskAlert.severity == severity)
    if resolved is not None:
        q = q.filter(RiskAlert.is_resolved == resolved)
    
    # Фильтр по организации для операторов
    if user.role.startswith("operator") and user.organization_id:
        from app.models import Aircraft
        q = q.join(Aircraft).filter(Aircraft.operator_id == user.organization_id)
    
    alerts = q.order_by(RiskAlert.due_at.asc(), RiskAlert.severity.desc()).limit(500).all()
    return [RiskAlertOut.model_validate(a) for a in alerts]


@router.post(
    "/risk-alerts/scan",
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def trigger_risk_scan(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Запускает сканирование рисков вручную."""
    created = scan_risks(db)
    return {"created": created, "message": f"Создано {created} предупреждений"}


@router.patch("/risk-alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Отмечает предупреждение как решённое."""
    from datetime import datetime, timezone
    
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Предупреждение не найдено")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return RiskAlertOut.model_validate(alert)
