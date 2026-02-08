"""API для проведения аудитов (проверок) по чек-листам."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Audit, AuditResponse, Finding, ChecklistTemplate, ChecklistItem, Aircraft
from app.schemas.audit import (
    AuditCreate, AuditOut, AuditResponseCreate, AuditResponseOut, FindingOut
)

router = APIRouter(tags=["checklist-audits"])


@router.get("/audits", response_model=list[AuditOut])
def list_audits(
    aircraft_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Список аудитов."""
    q = db.query(Audit)
    
    if aircraft_id:
        q = q.filter(Audit.aircraft_id == aircraft_id)
    if status:
        q = q.filter(Audit.status == status)
    
    # Фильтр по организации для операторов
    if user.role.startswith("operator") and user.organization_id:
        q = q.join(Aircraft).filter(Aircraft.operator_id == user.organization_id)
    
    audits = q.order_by(Audit.created_at.desc()).limit(200).all()
    return [AuditOut.model_validate(a) for a in audits]


@router.post(
    "/audits",
    response_model=AuditOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector", "operator_manager"))],
)
def create_audit(
    payload: AuditCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Создаёт новый аудит."""
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == payload.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    aircraft = db.query(Aircraft).filter(Aircraft.id == payload.aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="ВС не найдено")
    
    audit = Audit(
        template_id=payload.template_id,
        aircraft_id=payload.aircraft_id,
        planned_at=payload.planned_at,
        inspector_user_id=user.id,
        status="draft"
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return AuditOut.model_validate(audit)


@router.get("/audits/{audit_id}", response_model=AuditOut)
def get_audit(
    audit_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получает аудит с ответами и находками."""
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Аудит не найден")
    
    return AuditOut.model_validate(audit)


@router.post(
    "/audits/{audit_id}/responses",
    response_model=AuditResponseOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector", "operator_manager"))],
)
def submit_response(
    audit_id: str,
    payload: AuditResponseCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Отправляет ответ по пункту чек-листа. Автоматически создаёт Finding при non_compliant."""
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Аудит не найден")
    
    if audit.status == "completed":
        raise HTTPException(status_code=400, detail="Аудит уже завершён")
    
    item = db.query(ChecklistItem).filter(ChecklistItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Пункт чек-листа не найден")
    
    # Проверяем, нет ли уже ответа
    existing = db.query(AuditResponse).filter(
        AuditResponse.audit_id == audit_id,
        AuditResponse.item_id == payload.item_id
    ).first()
    
    if existing:
        existing.answer = payload.answer
        existing.comment = payload.comment
        existing.evidence_attachment_ids = payload.evidence_attachment_ids
        response = existing
    else:
        response = AuditResponse(
            audit_id=audit_id,
            item_id=payload.item_id,
            answer=payload.answer,
            comment=payload.comment,
            evidence_attachment_ids=payload.evidence_attachment_ids
        )
        db.add(response)
    
    # Автоматически создаём Finding при non_compliant
    if payload.answer == "non_compliant":
        existing_finding = db.query(Finding).filter(
            Finding.audit_id == audit_id,
            Finding.item_id == payload.item_id
        ).first()
        
        if not existing_finding:
            # Определяем severity и risk_score на основе типа пункта
            severity = "high"
            risk_score = 75
            if "критич" in item.text.lower() or "безопасн" in item.text.lower():
                severity = "critical"
                risk_score = 100
            elif "рекоменд" in item.text.lower():
                severity = "medium"
                risk_score = 50
            
            finding = Finding(
                audit_id=audit_id,
                response_id=response.id if hasattr(response, 'id') else None,
                item_id=payload.item_id,
                severity=severity,
                risk_score=risk_score,
                status="open",
                description=f"Несоответствие по пункту {item.code}: {item.text}"
            )
            db.add(finding)
    
    # Обновляем статус аудита
    if audit.status == "draft":
        audit.status = "in_progress"
    
    db.commit()
    db.refresh(response)
    return AuditResponseOut.model_validate(response)


@router.get("/audits/{audit_id}/responses", response_model=list[AuditResponseOut])
def list_responses(
    audit_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Список ответов по аудиту."""
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Аудит не найден")
    
    responses = db.query(AuditResponse).filter(AuditResponse.audit_id == audit_id).all()
    return [AuditResponseOut.model_validate(r) for r in responses]


@router.get("/audits/{audit_id}/findings", response_model=list[FindingOut])
def list_findings(
    audit_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Список находок (несоответствий) по аудиту."""
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Аудит не найден")
    
    findings = db.query(Finding).filter(Finding.audit_id == audit_id).order_by(Finding.severity.desc()).all()
    return [FindingOut.model_validate(f) for f in findings]


@router.patch(
    "/audits/{audit_id}/complete",
    response_model=AuditOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def complete_audit(
    audit_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Завершает аудит."""
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Аудит не найден")
    
    audit.status = "completed"
    audit.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(audit)
    return AuditOut.model_validate(audit)
