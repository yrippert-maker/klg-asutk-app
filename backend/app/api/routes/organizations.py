"""Organizations API — refactored: pagination, audit, DRY helpers."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_current_user, require_roles
from app.api.helpers import audit, diff_changes, is_authority, paginate_query
from app.api.deps import get_db
from app.models import Organization, User, Aircraft, CertApplication
from app.schemas.organization import OrganizationCreate, OrganizationOut, OrganizationUpdate

logger = logging.getLogger(__name__)
router = APIRouter(tags=["organizations"])


def _base_query(db: Session, user):
    q = db.query(Organization)
    if not is_authority(user) and user.organization_id:
        q = q.filter(Organization.id == user.organization_id)
    return q


@router.get("/organizations")
def list_organizations(
    q: str | None = Query(None, description="Search by name"),
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    """List organizations with pagination and search."""
    query = _base_query(db, user)
    if q:
        query = query.filter(Organization.name.ilike(f"%{q}%"))
    query = query.order_by(Organization.name)
    result = paginate_query(query, page, per_page)
    result["items"] = [OrganizationOut.model_validate(o) for o in result["items"]]
    return result


@router.post("/organizations", response_model=OrganizationOut, status_code=201,
             dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    org = Organization(**payload.model_dump())
    db.add(org)
    audit(db, user, "create", "organization", description=f"Created org: {payload.name}")
    db.commit(); db.refresh(org)
    return OrganizationOut.model_validate(org)


@router.get("/organizations/{org_id}", response_model=OrganizationOut)
def get_organization(org_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org: raise HTTPException(404, "Not found")
    if not is_authority(user) and user.organization_id != org_id:
        raise HTTPException(403, "Forbidden")
    return OrganizationOut.model_validate(org)


@router.patch("/organizations/{org_id}", response_model=OrganizationOut,
              dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def update_organization(org_id: str, payload: OrganizationUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org: raise HTTPException(404, "Not found")
    data = payload.model_dump(exclude_unset=True)
    if not data: return OrganizationOut.model_validate(org)
    changes = diff_changes(org, data)
    for k, v in data.items(): setattr(org, k, v)
    audit(db, user, "update", "organization", org_id, changes=changes)
    try:
        db.commit()
    except IntegrityError:
        db.rollback(); raise HTTPException(409, "Conflict (duplicate fields)")
    db.refresh(org)
    return OrganizationOut.model_validate(org)


@router.delete("/organizations/{org_id}", status_code=204,
               dependencies=[Depends(require_roles("admin", "authority_inspector"))])
def delete_organization(org_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org: raise HTTPException(404, "Not found")
    if db.query(User).filter(User.organization_id == org_id).count() > 0:
        raise HTTPException(409, "Organization has users")
    if db.query(Aircraft).filter(Aircraft.operator_id == org_id).count() > 0:
        raise HTTPException(409, "Organization has aircraft")
    if db.query(CertApplication).filter(CertApplication.applicant_org_id == org_id).count() > 0:
        raise HTTPException(409, "Organization has applications")
    audit(db, user, "delete", "organization", org_id, description=f"Deleted: {org.name}")
    db.delete(org); db.commit()
