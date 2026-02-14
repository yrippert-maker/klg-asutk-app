"""Airworthiness API — refactored: pagination, audit, DRY tenant checks."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.helpers import audit, diff_changes, check_aircraft_access, filter_by_org, paginate_query
from app.db.session import get_db
from app.models import AirworthinessCertificate, AircraftHistory, Aircraft
from app.schemas.airworthiness import (
    AirworthinessCertificateCreate, AirworthinessCertificateOut, AirworthinessCertificateUpdate,
    AircraftHistoryCreate, AircraftHistoryOut,
)

router = APIRouter(tags=["airworthiness"])


# === Certificates (ДЛГ) ===
@router.get("/airworthiness/certificates")
def list_certificates(
    aircraft_id: str | None = Query(None), status: str | None = Query(None),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(AirworthinessCertificate)
    if aircraft_id: q = q.filter(AirworthinessCertificate.aircraft_id == aircraft_id)
    if status: q = q.filter(AirworthinessCertificate.status == status)
    q = q.join(Aircraft).filter()
    q = filter_by_org(q, Aircraft, user)
    q = q.order_by(AirworthinessCertificate.issue_date.desc())
    return paginate_query(q, page, per_page)


@router.post("/airworthiness/certificates", response_model=AirworthinessCertificateOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def create_certificate(payload: AirworthinessCertificateCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_aircraft_access(db, user, payload.aircraft_id)
    if db.query(AirworthinessCertificate).filter(AirworthinessCertificate.certificate_number == payload.certificate_number).first():
        raise HTTPException(409, "Certificate number exists")
    cert = AirworthinessCertificate(**payload.model_dump(), issued_by_user_id=user.id)
    db.add(cert)
    audit(db, user, "create", "airworthiness_certificate", description=f"Cert {payload.certificate_number}")
    db.commit(); db.refresh(cert)
    return cert


@router.get("/airworthiness/certificates/{cert_id}", response_model=AirworthinessCertificateOut)
def get_certificate(cert_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cert = db.query(AirworthinessCertificate).filter(AirworthinessCertificate.id == cert_id).first()
    if not cert: raise HTTPException(404, "Not found")
    check_aircraft_access(db, user, cert.aircraft_id)
    return cert


@router.patch("/airworthiness/certificates/{cert_id}", response_model=AirworthinessCertificateOut,
              dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def update_certificate(cert_id: str, payload: AirworthinessCertificateUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cert = db.query(AirworthinessCertificate).filter(AirworthinessCertificate.id == cert_id).first()
    if not cert: raise HTTPException(404, "Not found")
    data = payload.model_dump(exclude_unset=True)
    changes = diff_changes(cert, data)
    for k, v in data.items(): setattr(cert, k, v)
    audit(db, user, "update", "airworthiness_certificate", cert_id, changes=changes)
    db.commit(); db.refresh(cert)
    return cert


# === Aircraft History ===
@router.get("/aircraft/{aircraft_id}/history")
def get_aircraft_history(
    aircraft_id: str, event_type: str | None = Query(None),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    check_aircraft_access(db, user, aircraft_id)
    q = db.query(AircraftHistory).filter(AircraftHistory.aircraft_id == aircraft_id)
    if event_type: q = q.filter(AircraftHistory.event_type == event_type)
    q = q.order_by(AircraftHistory.event_date.desc())
    return paginate_query(q, page, per_page)


@router.post("/aircraft/{aircraft_id}/history", response_model=AircraftHistoryOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "mro_user", "mro_manager"))])
def create_history_entry(aircraft_id: str, payload: AircraftHistoryCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_aircraft_access(db, user, aircraft_id)
    data = payload.model_dump()
    data["aircraft_id"] = aircraft_id
    if not data.get("performed_by_org_id"): data["performed_by_org_id"] = user.organization_id
    if not data.get("performed_by_user_id"): data["performed_by_user_id"] = user.id
    h = AircraftHistory(**data)
    db.add(h)
    audit(db, user, "create", "aircraft_history", description=f"History for {aircraft_id}")
    db.commit(); db.refresh(h)
    return h
