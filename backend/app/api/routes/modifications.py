"""
API routes для управления модификациями воздушных судов.

Соответствует требованиям ИКАО Annex 8: отслеживание обязательных модификаций
(AD - Airworthiness Directives, SB - Service Bulletins, STC - Supplemental Type Certificates).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import AircraftModification, Aircraft
from app.schemas.modifications import (
    AircraftModificationCreate,
    AircraftModificationOut,
    AircraftModificationUpdate,
)

router = APIRouter(tags=["modifications"])


@router.get("/aircraft/{aircraft_id}/modifications", response_model=list[AircraftModificationOut])
def list_modifications(
    aircraft_id: str,
    modification_type: str | None = Query(None, description="Filter by modification type (AD, SB, STC)"),
    compliance_status: str | None = Query(None, description="Filter by compliance status"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить список модификаций для воздушного судна."""
    # Проверка доступа к ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    
    if user.role.startswith("operator") and user.organization_id and aircraft.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    query = db.query(AircraftModification).filter(AircraftModification.aircraft_id == aircraft_id)
    
    if modification_type:
        query = query.filter(AircraftModification.modification_type == modification_type)
    
    if compliance_status:
        query = query.filter(AircraftModification.compliance_status == compliance_status)
    
    return query.order_by(AircraftModification.compliance_date.desc()).all()


@router.post(
    "/aircraft/{aircraft_id}/modifications",
    response_model=AircraftModificationOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "authority_inspector"))],
)
def create_modification(
    aircraft_id: str,
    payload: AircraftModificationCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Создать новую модификацию для воздушного судна."""
    # Проверка существования ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    
    # Проверка доступа
    if user.role.startswith("operator") and user.organization_id and aircraft.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Установка aircraft_id из URL
    mod_data = payload.model_dump()
    mod_data["aircraft_id"] = aircraft_id
    
    # Автоматическое заполнение организации и пользователя (если не указаны)
    if not mod_data.get("performed_by_org_id") and user.organization_id:
        mod_data["performed_by_org_id"] = user.organization_id
    if not mod_data.get("performed_by_user_id"):
        mod_data["performed_by_user_id"] = user.id
    
    modification = AircraftModification(**mod_data)
    db.add(modification)
    db.commit()
    db.refresh(modification)
    return modification


@router.get("/modifications/{mod_id}", response_model=AircraftModificationOut)
def get_modification(
    mod_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить модификацию по ID."""
    modification = db.query(AircraftModification).filter(AircraftModification.id == mod_id).first()
    if not modification:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Проверка доступа к связанному ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == modification.aircraft_id).first()
    if user.role.startswith("operator") and user.organization_id and aircraft.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    return modification


@router.patch(
    "/modifications/{mod_id}",
    response_model=AircraftModificationOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "authority_inspector"))],
)
def update_modification(
    mod_id: str,
    payload: AircraftModificationUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Обновить модификацию."""
    modification = db.query(AircraftModification).filter(AircraftModification.id == mod_id).first()
    if not modification:
        raise HTTPException(status_code=404, detail="Not found")
    
    # Проверка доступа к связанному ВС
    aircraft = db.query(Aircraft).filter(Aircraft.id == modification.aircraft_id).first()
    if user.role.startswith("operator") and user.organization_id and aircraft.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(modification, k, v)
    
    db.commit()
    db.refresh(modification)
    return modification


@router.get("/modifications", response_model=list[AircraftModificationOut])
def list_all_modifications(
    compliance_required: bool | None = Query(None, description="Filter by compliance required"),
    compliance_status: str | None = Query(None, description="Filter by compliance status"),
    modification_type: str | None = Query(None, description="Filter by modification type"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить список всех модификаций (с фильтрацией)."""
    query = db.query(AircraftModification)
    
    # Operator-bound visibility
    if user.role.startswith("operator") and user.organization_id:
        query = query.join(Aircraft).filter(Aircraft.operator_id == user.organization_id)
    
    if compliance_required is not None:
        query = query.filter(AircraftModification.compliance_required == compliance_required)
    
    if compliance_status:
        query = query.filter(AircraftModification.compliance_status == compliance_status)
    
    if modification_type:
        query = query.filter(AircraftModification.modification_type == modification_type)
    
    return query.order_by(AircraftModification.compliance_date.desc()).all()
