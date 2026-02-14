"""Users API — refactored: pagination, DRY org_name, tenant visibility."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from datetime import datetime

from app.api.deps import get_current_user, require_roles
from app.api.helpers import get_org_name, is_authority, paginate_query
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import _coerce_datetime

router = APIRouter(tags=["users"])


class UserOut(BaseModel):
    id: str; external_subject: str; display_name: str; email: str | None
    role: str; organization_id: str | None; organization_name: str | None
    created_at: datetime; updated_at: datetime
    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def parse_dt(cls, v): return _coerce_datetime(v)


def _to_out(u: User, db: Session) -> UserOut:
    return UserOut(id=u.id, external_subject=u.external_subject, display_name=u.display_name,
                   email=u.email, role=u.role, organization_id=u.organization_id,
                   organization_name=get_org_name(db, u.organization_id),
                   created_at=u.created_at, updated_at=u.updated_at)


@router.get("/users")
def list_users(
    organization_id: str | None = None, role: str | None = None,
    page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db), user=Depends(get_current_user),
):
    q = db.query(User)
    if not is_authority(user) and user.organization_id:
        q = q.filter(User.organization_id == user.organization_id)
    if organization_id: q = q.filter(User.organization_id == organization_id)
    if role: q = q.filter(User.role == role)
    q = q.order_by(User.display_name)
    result = paginate_query(q, page, per_page)
    result["items"] = [_to_out(u, db) for u in result["items"]]
    return result


@router.get("/users/me", response_model=UserOut)
def get_me(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return _to_out(user, db)


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u: raise HTTPException(404, "User not found")
    return _to_out(u, db)
