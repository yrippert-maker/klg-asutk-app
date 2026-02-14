"""
Aircraft API routes — refactored for multi-user server deployment.
DRY: single serialization helper, pagination, audit logging.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Aircraft, AircraftType
from app.models.organization import Organization
from app.models.audit_log import AuditLog
from app.schemas.aircraft import AircraftCreate, AircraftOut, AircraftUpdate, AircraftTypeCreate, AircraftTypeOut

logger = logging.getLogger(__name__)
router = APIRouter(tags=["aircraft"])


def _serialize_aircraft(a: Aircraft, db: Session) -> AircraftOut:
    """Serialize Aircraft ORM -> AircraftOut schema. Single point of truth."""
    operator_name = None
    if a.operator_id:
        org = db.query(Organization).filter(Organization.id == a.operator_id).first()
        if org:
            operator_name = org.name
    return AircraftOut.model_validate({
        "id": a.id,
        "registration_number": a.registration_number,
        "aircraft_type": {
            "id": a.aircraft_type.id, "manufacturer": a.aircraft_type.manufacturer,
            "model": a.aircraft_type.model, "created_at": a.aircraft_type.created_at,
            "updated_at": a.aircraft_type.updated_at,
        } if a.aircraft_type else None,
        "operator_id": a.operator_id, "operator_name": operator_name,
        "serial_number": a.serial_number,
        "manufacture_date": getattr(a, 'manufacture_date', None),
        "first_flight_date": getattr(a, 'first_flight_date', None),
        "total_time": float(a.total_time) if a.total_time is not None else None,
        "total_cycles": getattr(a, 'total_cycles', None),
        "current_status": getattr(a, 'current_status', 'in_service') or "in_service",
        "configuration": getattr(a, 'configuration', None),
        "drawing_numbers": getattr(a, 'drawing_numbers', None),
        "work_completion_date": getattr(a, 'work_completion_date', None),
        "created_at": a.created_at, "updated_at": a.updated_at,
    })


def _base_query(db: Session, user=Depends(get_current_user)):
    q = db.query(Aircraft).options(joinedload(Aircraft.aircraft_type))
    if user.role.startswith("operator") and user.organization_id:
        q = q.filter(Aircraft.operator_id == user.organization_id)
    return q


def _audit(db, user, action, entity_id, **kw):
    db.add(AuditLog(user_id=user.id, user_email=user.email, user_role=user.role,
                     organization_id=user.organization_id, action=action,
                     entity_type="aircraft", entity_id=entity_id, **kw))


@router.get("/aircraft/types", response_model=list[AircraftTypeOut])
def list_types(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [AircraftTypeOut.model_validate(t) for t in
            db.query(AircraftType).order_by(AircraftType.manufacturer, AircraftType.model).all()]


@router.post("/aircraft/types", response_model=AircraftTypeOut,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def create_type(payload: AircraftTypeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = AircraftType(**payload.model_dump()); db.add(t); db.commit(); db.refresh(t)
    return AircraftTypeOut.model_validate(t)


@router.get("/aircraft")
def list_aircraft(
    q: str | None = Query(None), page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    """List aircraft with pagination. Returns {items, total, page, per_page, pages}."""
    query = _base_query(db, user)
    if q:
        query = query.filter(or_(Aircraft.registration_number.ilike(f"%{q}%"), Aircraft.drawing_numbers.ilike(f"%{q}%")))
    query = query.order_by(Aircraft.registration_number)
    total = query.count()
    items_raw = query.offset((page - 1) * per_page).limit(per_page).all()
    items = []
    for a in items_raw:
        try:
            if a.aircraft_type: items.append(_serialize_aircraft(a, db))
        except Exception as e:
            logger.error(f"Serialization error for aircraft {a.id}: {e}")
    return {"items": items, "total": total, "page": page, "per_page": per_page,
            "pages": (total + per_page - 1) // per_page}


@router.post("/aircraft", response_model=AircraftOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager"))])
def create_aircraft(payload: AircraftCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if db.query(Aircraft).filter(Aircraft.registration_number == payload.registration_number).first():
        raise HTTPException(409, "Aircraft already exists")
    if not db.query(AircraftType).filter(AircraftType.id == payload.aircraft_type_id).first():
        raise HTTPException(404, "AircraftType not found")
    op_id = payload.operator_id if not user.role.startswith("operator") else user.organization_id
    if not op_id: raise HTTPException(400, "operator_id required")
    a = Aircraft(registration_number=payload.registration_number, aircraft_type_id=payload.aircraft_type_id,
                 operator_id=op_id, serial_number=payload.serial_number,
                 manufacture_date=payload.manufacture_date, first_flight_date=payload.first_flight_date,
                 total_time=payload.total_time, total_cycles=payload.total_cycles,
                 current_status=payload.current_status, configuration=payload.configuration,
                 drawing_numbers=payload.drawing_numbers, work_completion_date=payload.work_completion_date)
    db.add(a); _audit(db, user, "create", None, description=f"Created {payload.registration_number}")
    db.commit(); db.refresh(a)
    return _serialize_aircraft(a, db)


@router.get("/aircraft/{aircraft_id}", response_model=AircraftOut)
def get_aircraft(aircraft_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = _base_query(db, user).filter(Aircraft.id == aircraft_id).first()
    if not a: raise HTTPException(404, "Not found")
    return _serialize_aircraft(a, db)


@router.patch("/aircraft/{aircraft_id}", response_model=AircraftOut,
              dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager"))])
def update_aircraft(aircraft_id: str, payload: AircraftUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = _base_query(db, user).filter(Aircraft.id == aircraft_id).first()
    if not a: raise HTTPException(404, "Not found")
    data = payload.model_dump(exclude_unset=True)
    changes = {}
    for k, v in data.items():
        old = getattr(a, k, None)
        if old != v: changes[k] = {"old": str(old), "new": str(v)}
        setattr(a, k, v)
    _audit(db, user, "update", aircraft_id, changes=changes)
    db.commit(); db.refresh(a)
    return _serialize_aircraft(a, db)


@router.delete("/aircraft/{aircraft_id}", status_code=204,
               dependencies=[Depends(require_roles("admin"))])
def delete_aircraft(aircraft_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not a: raise HTTPException(404, "Not found")
    _audit(db, user, "delete", aircraft_id, description=f"Deleted {a.registration_number}")
    db.delete(a); db.commit()
