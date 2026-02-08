"""
API routes для управления организациями.

Соответствует требованиям ТЗ: управление организациями (операторы, MRO, органы власти).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Organization, User, Aircraft, CertApplication
from app.schemas.organization import OrganizationCreate, OrganizationOut, OrganizationUpdate

logger = logging.getLogger(__name__)
router = APIRouter(tags=["organizations"])


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(
    q: str | None = Query(None, description="Search by organization name"),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить список организаций.
    
    Authority видит все; остальные видят только свою организацию.
    Поддерживает поиск по названию организации.
    """
    try:
        query = db.query(Organization)
        if user.role not in {"admin", "authority_inspector"} and user.organization_id:
            query = query.filter(Organization.id == user.organization_id)
        if q:
            query = query.filter(Organization.name.ilike(f"%{q}%"))
        orgs = query.order_by(Organization.name).all()
        result = []
        for org in orgs:
            try:
                result.append(OrganizationOut.model_validate(org))
            except Exception as e:
                logger.error(f"Ошибка при сериализации организации {org.id}: {str(e)}", exc_info=True)
                # Пропускаем проблемную организацию, но продолжаем обработку остальных
                continue
        logger.info(f"Успешно возвращено {len(result)} организаций из {len(orgs)}")
        return result
    except Exception as e:
        import traceback
        logger.error(f"Ошибка при получении списка организаций: {str(e)}", exc_info=True)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка организаций: {str(e)}"
        )


@router.post(
    "/organizations",
    response_model=OrganizationOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db)):
    """Создать новую организацию."""
    org = Organization(**payload.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return OrganizationOut.model_validate(org)


@router.get("/organizations/{org_id}", response_model=OrganizationOut)
def get_organization(org_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Получить детали организации по ID."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role not in {"admin", "authority_inspector"} and user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return OrganizationOut.model_validate(org)


@router.patch(
    "/organizations/{org_id}",
    response_model=OrganizationOut,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def update_organization(org_id: str, payload: OrganizationUpdate, db: Session = Depends(get_db)):
    """Обновить организацию."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Not found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        return OrganizationOut.model_validate(org)

    for k, v in data.items():
        setattr(org, k, v)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Conflict (duplicate fields)")
    db.refresh(org)
    return OrganizationOut.model_validate(org)


@router.delete(
    "/organizations/{org_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("admin", "authority_inspector"))],
)
def delete_organization(org_id: str, db: Session = Depends(get_db)):
    """Удалить организацию.
    
    Нельзя удалить, если есть связанные сущности (пользователи, ВС, заявки).
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Not found")

    # Проверка связанных сущностей
    if db.query(User).filter(User.organization_id == org_id).count() > 0:
        raise HTTPException(status_code=409, detail="Organization has users")
    if db.query(Aircraft).filter(Aircraft.operator_id == org_id).count() > 0:
        raise HTTPException(status_code=409, detail="Organization has aircraft")
    if db.query(CertApplication).filter(CertApplication.applicant_org_id == org_id).count() > 0:
        raise HTTPException(status_code=409, detail="Organization has applications")

    db.delete(org)
    db.commit()
    return None
