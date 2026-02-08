from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.config import settings
from app.db.session import get_db
from app.integration.piv import push_event
from app.models import CertApplication, ApplicationRemark, CertApplicationStatus
from app.schemas.cert_application import CertApplicationCreate, CertApplicationOut, RemarkCreate, RemarkOut
from app.services.notifications import notify

router = APIRouter(tags=["cert_applications"])


def _next_application_number(db: Session) -> str:
    # Prototype numbering: KLG-YYYYMMDD-NNNN
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"KLG-{today}-"
    existing = db.query(CertApplication).filter(CertApplication.number.like(prefix + "%")).count()
    return prefix + str(existing + 1).zfill(4)


@router.get("/cert-applications", response_model=list[CertApplicationOut])
def list_apps(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from app.models.organization import Organization
    
    q = db.query(CertApplication)
    if user.role.startswith("operator") or user.role.startswith("mro"):
        if user.organization_id:
            q = q.filter(CertApplication.applicant_org_id == user.organization_id)
        else:
            q = q.filter(False)
    apps = q.order_by(CertApplication.created_at.desc()).all()
    
    # Добавляем название организации-заявителя
    result = []
    for app in apps:
        org_name = None
        if app.applicant_org_id:
            org = db.query(Organization).filter(Organization.id == app.applicant_org_id).first()
            if org:
                org_name = org.name
        
        # Создаем объект с дополнительным полем applicant_org_name
        app_dict = {
            "id": app.id,
            "number": app.number,
            "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
            "applicant_org_id": app.applicant_org_id,
            "created_by_user_id": app.created_by_user_id,
            "submitted_at": app.submitted_at,
            "remarks_deadline_at": app.remarks_deadline_at,
            "subject": app.subject,
            "description": app.description,
            "created_at": app.created_at,
            "updated_at": app.updated_at,
            "applicant_org_name": org_name,
        }
        result.append(CertApplicationOut.model_validate(app_dict))
    
    return result


@router.post(
    "/cert-applications",
    response_model=CertApplicationOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "mro_user", "mro_manager"))],
)
def create_app(payload: CertApplicationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User has no organization_id")
    app = CertApplication(
        applicant_org_id=user.organization_id,
        created_by_user_id=user.id,
        number=_next_application_number(db),
        status=CertApplicationStatus.DRAFT,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/cert-applications/{app_id}", response_model=CertApplicationOut)
def get_app(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if (user.role.startswith("operator") or user.role.startswith("mro")) and user.organization_id != app.applicant_org_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return app


@router.post(
    "/cert-applications/{app_id}/submit",
    response_model=CertApplicationOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "mro_user", "mro_manager"))],
)
async def submit_app(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if user.organization_id != app.applicant_org_id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if app.status not in {CertApplicationStatus.DRAFT, CertApplicationStatus.REMARKS}:
        raise HTTPException(status_code=409, detail="Invalid status")

    app.status = CertApplicationStatus.SUBMITTED
    app.submitted_at = datetime.now(timezone.utc)
    app.remarks_deadline_at = None
    db.commit()
    db.refresh(app)

    # Notify authority (prototype: notify admin users is out of scope; we log to П-ИВ)
    await push_event("cert_application_submitted", {"number": app.number, "app_id": app.id})
    return app


@router.post(
    "/cert-applications/{app_id}/start-review",
    response_model=CertApplicationOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def start_review(app_id: str, db: Session = Depends(get_db)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if app.status != CertApplicationStatus.SUBMITTED:
        raise HTTPException(status_code=409, detail="Invalid status")
    app.status = CertApplicationStatus.UNDER_REVIEW
    db.commit()
    db.refresh(app)
    return app


@router.post(
    "/cert-applications/{app_id}/remarks",
    response_model=RemarkOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def add_remark(app_id: str, payload: RemarkCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")

    # Transition to REMARKS and set deadline
    app.status = CertApplicationStatus.REMARKS
    app.remarks_deadline_at = datetime.now(timezone.utc) + timedelta(days=settings.remark_deadline_days)

    r = ApplicationRemark(application_id=app_id, author_user_id=user.id, text=payload.text)
    db.add(r)
    db.commit()
    db.refresh(r)

    notify(
        db,
        recipient_user_id=app.created_by_user_id,
        title=f"Заявка {app.number}: выставлены замечания",
        body=f"Срок устранения: {settings.remark_deadline_days} дней (до {app.remarks_deadline_at.isoformat()}).",
    )
    return r


@router.get("/cert-applications/{app_id}/remarks", response_model=list[RemarkOut])
def list_remarks(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if (user.role.startswith("operator") or user.role.startswith("mro")) and user.organization_id != app.applicant_org_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return (
        db.query(ApplicationRemark)
        .filter(ApplicationRemark.application_id == app_id)
        .order_by(ApplicationRemark.created_at.desc())
        .all()
    )


@router.post(
    "/cert-applications/{app_id}/approve",
    response_model=CertApplicationOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def approve(app_id: str, db: Session = Depends(get_db)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if app.status not in {CertApplicationStatus.UNDER_REVIEW, CertApplicationStatus.SUBMITTED}:
        raise HTTPException(status_code=409, detail="Invalid status")
    app.status = CertApplicationStatus.APPROVED
    app.remarks_deadline_at = None
    db.commit()
    db.refresh(app)
    return app


@router.post(
    "/cert-applications/{app_id}/reject",
    response_model=CertApplicationOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def reject(app_id: str, db: Session = Depends(get_db)):
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    if app.status not in {CertApplicationStatus.UNDER_REVIEW, CertApplicationStatus.SUBMITTED, CertApplicationStatus.REMARKS}:
        raise HTTPException(status_code=409, detail="Invalid status")
    app.status = CertApplicationStatus.REJECTED
    app.remarks_deadline_at = None
    db.commit()
    db.refresh(app)
    return app
