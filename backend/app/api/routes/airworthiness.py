"""
API routes для управления лётной годностью согласно требованиям ИКАО Annex 8.

Соответствует требованиям:
- ИКАО Annex 8 (Airworthiness of Aircraft)
- EASA Part M (Continuing Airworthiness)
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import AirworthinessCertificate, AircraftHistory, Aircraft
from app.schemas.airworthiness import (
    AirworthinessCertificateCreate,
    AirworthinessCertificateOut,
    AirworthinessCertificateUpdate,
    AircraftHistoryCreate,
    AircraftHistoryOut,
)

router = APIRouter(tags=["airworthiness"])


# ========== Airworthiness Certificate (ДЛГ) ==========

@router.get("/airworthiness/certificates", response_model=list[AirworthinessCertificateOut])
def list_certificates(
    aircraft_id: str | None = Query(None, description="Filter by aircraft ID"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить список сертификатов лётной годности."""
    query = db.query(AirworthinessCertificate)
    
    if aircraft_id:
        query = query.filter(AirworthinessCertificate.aircraft_id == aircraft_id)
    
    # Operator-bound visibility
    if user.role.startswith("operator") and user.organization_id:
        query = query.join(Aircraft).filter(Aircraft.operator_id == user.organization_id)
    
    return query.order_by(AirworthinessCertificate.issue_date.desc()).all()


@router.post(
    "/airworthiness/certificates",
    response_model=AirworthinessCertificateOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def create_certificate(
    payload: AirworthinessCertificateCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Создать новый сертификат лётной годности."""
    # Проверка существования ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == payload.aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    
    # Проверка уникальности номера сертификата
    if db.query(AirworthinessCertificate).filter(
        AirworthinessCertificate.certificate_number == payload.certificate_number
    ).first():
        raise HTTPException(status_code=409, detail="Certificate number already exists")
    
    cert = AirworthinessCertificate(
        **payload.model_dump(),
        issued_by_user_id=user.id,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/airworthiness/certificates/{cert_id}", response_model=AirworthinessCertificateOut)
def get_certificate(
    cert_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить сертификат лётной годности по ID."""
    cert = db.query(AirworthinessCertificate).filter(AirworthinessCertificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Operator-bound visibility
    if user.role.startswith("operator") and user.organization_id:
        aircraft = db.query(Aircraft).filter(Aircraft.id == cert.aircraft_id).first()
        if aircraft and aircraft.operator_id != user.organization_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    
    return cert


@router.patch(
    "/airworthiness/certificates/{cert_id}",
    response_model=AirworthinessCertificateOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def update_certificate(
    cert_id: str,
    payload: AirworthinessCertificateUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Обновить сертификат лётной годности."""
    cert = db.query(AirworthinessCertificate).filter(AirworthinessCertificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Not found")
    
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(cert, k, v)
    
    db.commit()
    db.refresh(cert)
    return cert


# ========== Aircraft History ==========

@router.get("/aircraft/{aircraft_id}/history", response_model=list[AircraftHistoryOut])
def get_aircraft_history(
    aircraft_id: str,
    event_type: str | None = Query(None, description="Filter by event type"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить историю событий воздушного судна."""
    # Проверка доступа к ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    
    if user.role.startswith("operator") and user.organization_id and aircraft.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    query = db.query(AircraftHistory).filter(AircraftHistory.aircraft_id == aircraft_id)
    
    if event_type:
        query = query.filter(AircraftHistory.event_type == event_type)
    
    return query.order_by(AircraftHistory.event_date.desc()).all()


@router.post(
    "/aircraft/{aircraft_id}/history",
    response_model=AircraftHistoryOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "mro_user", "mro_manager"))],
)
def create_history_entry(
    aircraft_id: str,
    payload: AircraftHistoryCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Создать запись в истории ВС."""
    # Проверка существования ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    
    # Проверка доступа
    if user.role.startswith("operator") and user.organization_id and aircraft.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Установка aircraft_id из URL
    history_data = payload.model_dump()
    history_data["aircraft_id"] = aircraft_id
    
    # Автоматическое заполнение организации и пользователя
    if not history_data.get("performed_by_org_id") and user.organization_id:
        history_data["performed_by_org_id"] = user.organization_id
    if not history_data.get("performed_by_user_id"):
        history_data["performed_by_user_id"] = user.id
    
    history = AircraftHistory(**history_data)
    db.add(history)
    db.commit()
    db.refresh(history)
    return history
