import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Aircraft, AircraftType
from app.schemas.aircraft import AircraftCreate, AircraftOut, AircraftUpdate, AircraftTypeCreate, AircraftTypeOut

logger = logging.getLogger(__name__)
router = APIRouter(tags=["aircraft"])


@router.get("/aircraft/types", response_model=list[AircraftTypeOut])
def list_types(db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        types = db.query(AircraftType).order_by(AircraftType.manufacturer, AircraftType.model).all()
        result = []
        for t in types:
            try:
                result.append(AircraftTypeOut.model_validate(t))
            except Exception as e:
                logger.error(f"Ошибка при сериализации типа ВС {t.id}: {str(e)}", exc_info=True)
                continue
        logger.info(f"Успешно возвращено {len(result)} типов ВС из {len(types)}")
        return result
    except Exception as e:
        import traceback
        logger.error(f"Ошибка при получении списка типов ВС: {str(e)}", exc_info=True)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка типов ВС: {str(e)}"
        )


@router.post(
    "/aircraft/types",
    response_model=AircraftTypeOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def create_type(payload: AircraftTypeCreate, db: Session = Depends(get_db)):
    t = AircraftType(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/aircraft", response_model=list[AircraftOut])
def list_aircraft(
    q: str | None = Query(None, description="Search by registration number or drawing numbers"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        from sqlalchemy.orm import joinedload
        from app.models.organization import Organization

        query = db.query(Aircraft).options(joinedload(Aircraft.aircraft_type))
        # Operator-bound visibility
        if user.role.startswith("operator") and user.organization_id:
            query = query.filter(Aircraft.operator_id == user.organization_id)
        if q:
            # Поиск по регистрационному номеру или чертежному номеру
            query = query.filter(
                or_(
                    Aircraft.registration_number.ilike(f"%{q}%"),
                    Aircraft.drawing_numbers.ilike(f"%{q}%")
                )
            )
        aircraft_list = query.order_by(Aircraft.registration_number).all()

        # Добавляем название организации-оператора
        result = []
        for a in aircraft_list:
            try:
                if not a.aircraft_type or not a.operator_id:
                    continue
                operator_name = None
                if a.operator_id:
                    org = db.query(Organization).filter(Organization.id == a.operator_id).first()
                    if org:
                        operator_name = org.name

                aircraft_out = AircraftOut.model_validate({
                    "id": a.id,
                    "registration_number": a.registration_number,
                    "aircraft_type": {
                        "id": a.aircraft_type.id,
                        "manufacturer": a.aircraft_type.manufacturer,
                "model": a.aircraft_type.model,
                "created_at": a.aircraft_type.created_at,
                "updated_at": a.aircraft_type.updated_at,
            },
            "operator_id": a.operator_id,
            "operator_name": operator_name,
            "serial_number": getattr(a, 'serial_number', None),
            "manufacture_date": getattr(a, 'manufacture_date', None),
            "first_flight_date": getattr(a, 'first_flight_date', None),
            "total_time": float(getattr(a, 'total_time', 0)) if getattr(a, 'total_time', None) is not None else None,
            "total_cycles": getattr(a, 'total_cycles', None),
            "current_status": getattr(a, 'current_status', 'in_service') or "in_service",
            "configuration": getattr(a, 'configuration', None),
            "drawing_numbers": getattr(a, 'drawing_numbers', None),
            "work_completion_date": getattr(a, 'work_completion_date', None),
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        })
                result.append(aircraft_out)
            except Exception as e:
                logger.error(f"Ошибка при сериализации ВС {a.id}: {str(e)}", exc_info=True)
                # Пропускаем проблемное ВС, но продолжаем обработку остальных
                continue
        
        logger.info(f"Успешно возвращено {len(result)} ВС из {len(aircraft_list)}")
        return result
    except Exception as e:
        import traceback
        logger.error(f"Ошибка при получении списка ВС: {str(e)}", exc_info=True)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка ВС: {str(e)}"
        )


@router.post(
    "/aircraft",
    response_model=AircraftOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager"))],
)
def create_aircraft(payload: AircraftCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if db.query(Aircraft).filter(Aircraft.registration_number == payload.registration_number).first():
        raise HTTPException(status_code=409, detail="Already exists")

    at = db.query(AircraftType).filter(AircraftType.id == payload.aircraft_type_id).first()
    if not at:
        raise HTTPException(status_code=404, detail="AircraftType not found")

    operator_id = payload.operator_id
    if user.role.startswith("operator"):
        operator_id = user.organization_id
    if not operator_id:
        raise HTTPException(status_code=400, detail="operator_id is required")

    a = Aircraft(
        registration_number=payload.registration_number,
        aircraft_type_id=payload.aircraft_type_id,
        operator_id=operator_id,
        serial_number=payload.serial_number,
        manufacture_date=payload.manufacture_date,
        first_flight_date=payload.first_flight_date,
        total_time=payload.total_time,
        total_cycles=payload.total_cycles,
        current_status=payload.current_status,
        configuration=payload.configuration,
        drawing_numbers=payload.drawing_numbers,
        work_completion_date=payload.work_completion_date,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    
    # Получаем название оператора
    operator_name = None
    if a.operator_id:
        org = db.query(Organization).filter(Organization.id == a.operator_id).first()
        if org:
            operator_name = org.name
    
    # Создаем объект AircraftOut с дополнительным полем operator_name
    aircraft_out = AircraftOut.model_validate({
        "id": a.id,
        "registration_number": a.registration_number,
        "aircraft_type": {
            "id": a.aircraft_type.id,
            "manufacturer": a.aircraft_type.manufacturer,
            "model": a.aircraft_type.model,
            "created_at": a.aircraft_type.created_at,
            "updated_at": a.aircraft_type.updated_at,
        },
        "operator_id": a.operator_id,
        "operator_name": operator_name,
        "serial_number": getattr(a, 'serial_number', None),
        "manufacture_date": getattr(a, 'manufacture_date', None),
        "first_flight_date": getattr(a, 'first_flight_date', None),
        "total_time": float(getattr(a, 'total_time', 0)) if getattr(a, 'total_time', None) is not None else None,
        "total_cycles": getattr(a, 'total_cycles', None),
        "current_status": getattr(a, 'current_status', 'in_service') or "in_service",
        "configuration": getattr(a, 'configuration', None),
        "drawing_numbers": getattr(a, 'drawing_numbers', None),
        "work_completion_date": getattr(a, 'work_completion_date', None),
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    })
    return aircraft_out


@router.get("/aircraft/{aircraft_id}", response_model=AircraftOut)
def get_aircraft(aircraft_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from sqlalchemy.orm import joinedload

    a = db.query(Aircraft).options(joinedload(Aircraft.aircraft_type)).filter(Aircraft.id == aircraft_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role.startswith("operator") and user.organization_id and a.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not a.aircraft_type:
        raise HTTPException(status_code=500, detail="Aircraft has no aircraft_type (data integrity)")

    # Получаем название оператора
    operator_name = None
    if a.operator_id:
        org = db.query(Organization).filter(Organization.id == a.operator_id).first()
        if org:
            operator_name = org.name
    
    # Создаем объект AircraftOut с дополнительным полем operator_name
    aircraft_out = AircraftOut.model_validate({
        "id": a.id,
        "registration_number": a.registration_number,
        "aircraft_type": {
            "id": a.aircraft_type.id,
            "manufacturer": a.aircraft_type.manufacturer,
            "model": a.aircraft_type.model,
            "created_at": a.aircraft_type.created_at,
            "updated_at": a.aircraft_type.updated_at,
        },
        "operator_id": a.operator_id,
        "operator_name": operator_name,
        "serial_number": getattr(a, 'serial_number', None),
        "manufacture_date": getattr(a, 'manufacture_date', None),
        "first_flight_date": getattr(a, 'first_flight_date', None),
        "total_time": float(getattr(a, 'total_time', 0)) if getattr(a, 'total_time', None) is not None else None,
        "total_cycles": getattr(a, 'total_cycles', None),
        "current_status": getattr(a, 'current_status', 'in_service') or "in_service",
        "configuration": getattr(a, 'configuration', None),
        "drawing_numbers": getattr(a, 'drawing_numbers', None),
        "work_completion_date": getattr(a, 'work_completion_date', None),
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    })
    return aircraft_out


@router.patch(
    "/aircraft/{aircraft_id}",
    response_model=AircraftOut,
    dependencies=[Depends(require_roles("admin", "operator_user", "operator_manager"))],
)
def update_aircraft(aircraft_id: str, payload: AircraftUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Обновить данные воздушного судна."""
    from sqlalchemy.orm import joinedload

    a = db.query(Aircraft).options(joinedload(Aircraft.aircraft_type)).filter(Aircraft.id == aircraft_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role.startswith("operator") and user.organization_id and a.operator_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not a.aircraft_type:
        raise HTTPException(status_code=500, detail="Aircraft has no aircraft_type (data integrity)")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(a, k, v)
    
    db.commit()
    db.refresh(a)
    
    # Получаем название оператора
    operator_name = None
    if a.operator_id:
        org = db.query(Organization).filter(Organization.id == a.operator_id).first()
        if org:
            operator_name = org.name
    
    # Создаем объект AircraftOut с дополнительным полем operator_name
    aircraft_out = AircraftOut.model_validate({
        "id": a.id,
        "registration_number": a.registration_number,
        "aircraft_type": {
            "id": a.aircraft_type.id,
            "manufacturer": a.aircraft_type.manufacturer,
            "model": a.aircraft_type.model,
            "created_at": a.aircraft_type.created_at,
            "updated_at": a.aircraft_type.updated_at,
        },
        "operator_id": a.operator_id,
        "operator_name": operator_name,
        "serial_number": getattr(a, 'serial_number', None),
        "manufacture_date": getattr(a, 'manufacture_date', None),
        "first_flight_date": getattr(a, 'first_flight_date', None),
        "total_time": float(getattr(a, 'total_time', 0)) if getattr(a, 'total_time', None) is not None else None,
        "total_cycles": getattr(a, 'total_cycles', None),
        "current_status": getattr(a, 'current_status', 'in_service') or "in_service",
        "configuration": getattr(a, 'configuration', None),
        "drawing_numbers": getattr(a, 'drawing_numbers', None),
        "work_completion_date": getattr(a, 'work_completion_date', None),
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    })
    return aircraft_out
