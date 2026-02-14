"""Checklist Audits API — refactored: pagination, audit trail, tenant filtering."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.helpers import audit as audit_log, filter_by_org, paginate_query, check_aircraft_access
from app.db.session import get_db
from app.models import Audit, AuditResponse, Finding, ChecklistTemplate, ChecklistItem, Aircraft
from app.schemas.audit import AuditCreate, AuditOut, AuditResponseCreate, AuditResponseOut, FindingOut
from app.services.ws_manager import ws_manager, make_notification

router = APIRouter(tags=["checklist-audits"])


@router.get("/audits")
def list_audits(
    aircraft_id: str | None = None, status: str | None = None,
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(Audit)
    if aircraft_id: q = q.filter(Audit.aircraft_id == aircraft_id)
    if status: q = q.filter(Audit.status == status)
    q = filter_by_org(q.join(Aircraft), Aircraft, user)
    q = q.order_by(Audit.created_at.desc())
    result = paginate_query(q, page, per_page)
    result["items"] = [AuditOut.model_validate(a) for a in result["items"]]
    return result


@router.post("/audits", response_model=AuditOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "authority_inspector", "operator_manager"))])
def create_audit(payload: AuditCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.query(ChecklistTemplate).filter(ChecklistTemplate.id == payload.template_id).first():
        raise HTTPException(404, "Template not found")
    check_aircraft_access(db, user, payload.aircraft_id)
    a = Audit(template_id=payload.template_id, aircraft_id=payload.aircraft_id,
              planned_at=payload.planned_at, inspector_user_id=user.id, status="draft")
    db.add(a)
    audit_log(db, user, "create", "audit", description=f"Audit for aircraft {payload.aircraft_id}")
    db.commit(); db.refresh(a)
    return AuditOut.model_validate(a)


@router.get("/audits/{audit_id}", response_model=AuditOut)
def get_audit(audit_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Audit).filter(Audit.id == audit_id).first()
    if not a: raise HTTPException(404, "Not found")
    return AuditOut.model_validate(a)


@router.post("/audits/{audit_id}/responses", response_model=AuditResponseOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector", "operator_manager"))])
def submit_response(audit_id: str, payload: AuditResponseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Audit).filter(Audit.id == audit_id).first()
    if not a: raise HTTPException(404, "Audit not found")
    if a.status == "completed": raise HTTPException(400, "Audit completed")
    item = db.query(ChecklistItem).filter(ChecklistItem.id == payload.item_id).first()
    if not item: raise HTTPException(404, "Checklist item not found")

    existing = db.query(AuditResponse).filter(AuditResponse.audit_id == audit_id, AuditResponse.item_id == payload.item_id).first()
    if existing:
        existing.answer = payload.answer; existing.comment = payload.comment
        existing.evidence_attachment_ids = payload.evidence_attachment_ids
        response = existing
    else:
        response = AuditResponse(audit_id=audit_id, item_id=payload.item_id, answer=payload.answer,
                                 comment=payload.comment, evidence_attachment_ids=payload.evidence_attachment_ids)
        db.add(response)

    # Auto-finding on non_compliant
    if payload.answer == "non_compliant":
        if not db.query(Finding).filter(Finding.audit_id == audit_id, Finding.item_id == payload.item_id).first():
            sev = "critical" if any(w in item.text.lower() for w in ["критич", "безопасн"]) else \
                  "medium" if "рекоменд" in item.text.lower() else "high"
            db.add(Finding(audit_id=audit_id, response_id=getattr(response, 'id', None),
                           item_id=payload.item_id, severity=sev, risk_score={"critical":100,"high":75,"medium":50}.get(sev, 50),
                           status="open", description=f"Несоответствие: {item.code} — {item.text}"))

    if a.status == "draft": a.status = "in_progress"
    audit_log(db, user, "update", "audit", audit_id, description=f"Response: {item.code} = {payload.answer}")
    db.commit(); db.refresh(response)
    return AuditResponseOut.model_validate(response)


@router.get("/audits/{audit_id}/responses", response_model=list[AuditResponseOut])
def list_responses(audit_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.query(Audit).filter(Audit.id == audit_id).first(): raise HTTPException(404, "Not found")
    return [AuditResponseOut.model_validate(r) for r in db.query(AuditResponse).filter(AuditResponse.audit_id == audit_id).all()]


@router.get("/audits/{audit_id}/findings", response_model=list[FindingOut])
def list_findings(audit_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.query(Audit).filter(Audit.id == audit_id).first(): raise HTTPException(404, "Not found")
    return [FindingOut.model_validate(f) for f in db.query(Finding).filter(Finding.audit_id == audit_id).order_by(Finding.severity.desc()).all()]


@router.patch("/audits/{audit_id}/complete", response_model=AuditOut,
              dependencies=[Depends(require_roles("admin", "authority_inspector"))])
async def complete_audit(audit_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Audit).filter(Audit.id == audit_id).first()
    if not a: raise HTTPException(404, "Not found")
    a.status = "completed"; a.completed_at = datetime.now(timezone.utc)
    audit_log(db, user, "update", "audit", audit_id, description="Completed")
    db.commit(); db.refresh(a)
    await ws_manager.broadcast(make_notification("audit_completed", "audit", audit_id))
    return AuditOut.model_validate(a)
