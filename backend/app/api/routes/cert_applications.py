"""Cert Applications API — refactored: pagination, audit, WebSocket notifications."""
from __future__ import annotations
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.services.email_service import email_service
from app.api.helpers import audit, is_authority, get_org_name, paginate_query
from app.api.deps import get_db
from app.integration.piv import push_event
from app.models import CertApplication, ApplicationRemark, CertApplicationStatus
from app.models.organization import Organization
from app.schemas.cert_application import CertApplicationCreate, CertApplicationOut, RemarkCreate, RemarkOut
from app.services.notifications import notify
from app.services.ws_manager import ws_manager, make_notification

router = APIRouter(tags=["cert_applications"])

REMARK_DEADLINE_DAYS = 30


def _next_number(db: Session) -> str:
    """Генерация номера с защитой от race condition через SELECT FOR UPDATE."""
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"KLG-{today}-"
    rows = (
        db.query(CertApplication)
        .filter(CertApplication.number.like(prefix + "%"))
        .with_for_update()
        .all()
    )
    return prefix + str(len(rows) + 1).zfill(4)


def _serialize(app, db: Session) -> CertApplicationOut:
    return CertApplicationOut.model_validate({
        "id": app.id, "number": app.number,
        "status": app.status.value if hasattr(app.status, 'value') else str(app.status),
        "applicant_org_id": app.applicant_org_id,
        "applicant_org_name": get_org_name(db, app.applicant_org_id),
        "created_by_user_id": app.created_by_user_id,
        "submitted_at": app.submitted_at, "remarks_deadline_at": app.remarks_deadline_at,
        "subject": app.subject, "description": app.description,
        "created_at": app.created_at, "updated_at": app.updated_at,
    })


def _get_app(db, app_id, user) -> CertApplication:
    app = db.query(CertApplication).filter(CertApplication.id == app_id).first()
    if not app: raise HTTPException(404, "Not found")
    if not is_authority(user) and user.organization_id != app.applicant_org_id:
        raise HTTPException(403, "Forbidden")
    return app


# --- LIST ---
@router.get("/cert-applications")
def list_apps(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(CertApplication)
    if not is_authority(user):
        if user.organization_id:
            q = q.filter(CertApplication.applicant_org_id == user.organization_id)
        else:
            q = q.filter(False)
    if status_filter:
        q = q.filter(CertApplication.status == status_filter)
    q = q.order_by(CertApplication.created_at.desc())
    result = paginate_query(q, page, per_page)
    result["items"] = [_serialize(a, db) for a in result["items"]]
    return result


# --- CRUD ---
@router.post("/cert-applications", response_model=CertApplicationOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "mro_user", "mro_manager"))])
def create_app(payload: CertApplicationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not user.organization_id: raise HTTPException(400, "User has no organization_id")
    app = CertApplication(
        applicant_org_id=user.organization_id, created_by_user_id=user.id,
        number=_next_number(db), status=CertApplicationStatus.DRAFT,
        subject=payload.subject, description=payload.description,
    )
    db.add(app)
    audit(db, user, "create", "cert_application", description=f"Created {app.number}")
    db.commit(); db.refresh(app)
    return _serialize(app, db)


@router.get("/cert-applications/{app_id}", response_model=CertApplicationOut)
def get_app_detail(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return _serialize(_get_app(db, app_id, user), db)


# --- WORKFLOW ---
@router.post("/cert-applications/{app_id}/submit", response_model=CertApplicationOut,
             dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "mro_user", "mro_manager"))])
async def submit_app(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = _get_app(db, app_id, user)
    if app.status not in {CertApplicationStatus.DRAFT, CertApplicationStatus.REMARKS}:
        raise HTTPException(409, "Invalid status")
    app.status = CertApplicationStatus.SUBMITTED
    app.submitted_at = datetime.now(timezone.utc)
    app.remarks_deadline_at = None
    audit(db, user, "update", "cert_application", app_id, description=f"Submitted {app.number}")
    db.commit(); db.refresh(app)
    await push_event("cert_application_submitted", {"number": app.number, "app_id": app.id})
    await ws_manager.broadcast(make_notification("submitted", "cert_application", app.id, number=app.number))
    return _serialize(app, db)


@router.post("/cert-applications/{app_id}/start-review", response_model=CertApplicationOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def start_review(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = _get_app(db, app_id, user)
    if app.status != CertApplicationStatus.SUBMITTED: raise HTTPException(409, "Invalid status")
    app.status = CertApplicationStatus.UNDER_REVIEW
    audit(db, user, "update", "cert_application", app_id, description=f"Review started {app.number}")
    db.commit(); db.refresh(app)
    return _serialize(app, db)


@router.post("/cert-applications/{app_id}/remarks", response_model=RemarkOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def add_remark(app_id: str, payload: RemarkCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = _get_app(db, app_id, user)
    app.status = CertApplicationStatus.REMARKS
    app.remarks_deadline_at = datetime.now(timezone.utc) + timedelta(days=REMARK_DEADLINE_DAYS)
    r = ApplicationRemark(application_id=app_id, author_user_id=user.id, text=payload.text)
    db.add(r)
    audit(db, user, "update", "cert_application", app_id, description=f"Remark added to {app.number}")
    db.commit(); db.refresh(r)
    notify(db, app.created_by_user_id, f"Заявка {app.number}: замечания",
           f"Срок: {REMARK_DEADLINE_DAYS} дн. (до {app.remarks_deadline_at.isoformat()})")
    return r


@router.get("/cert-applications/{app_id}/remarks", response_model=list[RemarkOut])
def list_remarks(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    _get_app(db, app_id, user)  # access check
    return db.query(ApplicationRemark).filter(ApplicationRemark.application_id == app_id).order_by(ApplicationRemark.created_at.desc()).all()


@router.post("/cert-applications/{app_id}/approve", response_model=CertApplicationOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
async def approve(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = _get_app(db, app_id, user)
    if app.status not in {CertApplicationStatus.UNDER_REVIEW, CertApplicationStatus.SUBMITTED}:
        raise HTTPException(409, "Invalid status")
    app.status = CertApplicationStatus.APPROVED; app.remarks_deadline_at = None
    audit(db, user, "update", "cert_application", app_id, description=f"Approved {app.number}")
    db.commit(); db.refresh(app)
    await ws_manager.send_to_org(app.applicant_org_id, make_notification("approved", "cert_application", app.id, number=app.number))
    return _serialize(app, db)


@router.post("/cert-applications/{app_id}/reject", response_model=CertApplicationOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
async def reject(app_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    app = _get_app(db, app_id, user)
    if app.status not in {CertApplicationStatus.UNDER_REVIEW, CertApplicationStatus.SUBMITTED, CertApplicationStatus.REMARKS}:
        raise HTTPException(409, "Invalid status")
    app.status = CertApplicationStatus.REJECTED; app.remarks_deadline_at = None
    audit(db, user, "update", "cert_application", app_id, description=f"Rejected {app.number}")
    db.commit(); db.refresh(app)
    await ws_manager.send_to_org(app.applicant_org_id, make_notification("rejected", "cert_application", app.id, number=app.number))
    return _serialize(app, db)
