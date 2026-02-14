"""Modifications API — refactored: pagination, audit, DRY."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.api.helpers import audit, diff_changes, check_aircraft_access, filter_by_org, paginate_query
from app.db.session import get_db
from app.models import AircraftModification, Aircraft
from app.schemas.modifications import AircraftModificationCreate, AircraftModificationOut, AircraftModificationUpdate

router = APIRouter(tags=["modifications"])


@router.get("/aircraft/{aircraft_id}/modifications")
def list_modifications(
    aircraft_id: str, modification_type: str | None = Query(None),
    compliance_status: str | None = Query(None),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    check_aircraft_access(db, user, aircraft_id)
    q = db.query(AircraftModification).filter(AircraftModification.aircraft_id == aircraft_id)
    if modification_type: q = q.filter(AircraftModification.modification_type == modification_type)
    if compliance_status: q = q.filter(AircraftModification.compliance_status == compliance_status)
    q = q.order_by(AircraftModification.compliance_date.desc())
    return paginate_query(q, page, per_page)


@router.post("/aircraft/{aircraft_id}/modifications", response_model=AircraftModificationOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "authority_inspector"))])
def create_modification(aircraft_id: str, payload: AircraftModificationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    check_aircraft_access(db, user, aircraft_id)
    data = payload.model_dump()
    data["aircraft_id"] = aircraft_id
    if not data.get("performed_by_org_id"): data["performed_by_org_id"] = user.organization_id
    if not data.get("performed_by_user_id"): data["performed_by_user_id"] = user.id
    mod = AircraftModification(**data)
    db.add(mod)
    audit(db, user, "create", "modification", description=f"Mod {payload.modification_number} for {aircraft_id}")
    db.commit(); db.refresh(mod)
    return mod


@router.get("/modifications/{mod_id}", response_model=AircraftModificationOut)
def get_modification(mod_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    mod = db.query(AircraftModification).filter(AircraftModification.id == mod_id).first()
    if not mod: raise HTTPException(404, "Not found")
    check_aircraft_access(db, user, mod.aircraft_id)
    return mod


@router.patch("/modifications/{mod_id}", response_model=AircraftModificationOut,
              dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager", "authority_inspector"))])
def update_modification(mod_id: str, payload: AircraftModificationUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    mod = db.query(AircraftModification).filter(AircraftModification.id == mod_id).first()
    if not mod: raise HTTPException(404, "Not found")
    check_aircraft_access(db, user, mod.aircraft_id)
    data = payload.model_dump(exclude_unset=True)
    changes = diff_changes(mod, data)
    for k, v in data.items(): setattr(mod, k, v)
    audit(db, user, "update", "modification", mod_id, changes=changes)
    db.commit(); db.refresh(mod)
    return mod


@router.get("/modifications")
def list_all_modifications(
    compliance_required: bool | None = Query(None), compliance_status: str | None = Query(None),
    modification_type: str | None = Query(None),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(AircraftModification)
    q = filter_by_org(q.join(Aircraft), Aircraft, user)
    if compliance_required is not None: q = q.filter(AircraftModification.compliance_required == compliance_required)
    if compliance_status: q = q.filter(AircraftModification.compliance_status == compliance_status)
    if modification_type: q = q.filter(AircraftModification.modification_type == modification_type)
    q = q.order_by(AircraftModification.compliance_date.desc())
    return paginate_query(q, page, per_page)
