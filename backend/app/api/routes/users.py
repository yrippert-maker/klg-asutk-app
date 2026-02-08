"""
API endpoints для управления пользователями.

В production пользователи управляются через АСУ ТК-ИБ, здесь только чтение.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from datetime import datetime

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.common import _coerce_datetime

router = APIRouter(tags=["users"])


class UserOut(BaseModel):
    id: str
    external_subject: str
    display_name: str
    email: str | None
    role: str
    organization_id: str | None
    organization_name: str | None
    created_at: datetime
    updated_at: datetime

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def parse_dt(cls, v):
        return _coerce_datetime(v)


@router.get("/users", response_model=list[UserOut])
def list_users(
    organization_id: str | None = None,
    role: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить список пользователей."""
    query = db.query(User)
    
    if organization_id:
        query = query.filter(User.organization_id == organization_id)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.order_by(User.display_name).all()
    
    # Добавляем название организации
    result = []
    for u in users:
        org_name = None
        if u.organization_id:
            org = db.query(Organization).filter(Organization.id == u.organization_id).first()
            if org:
                org_name = org.name
        
        result.append(UserOut(
            id=u.id,
            external_subject=u.external_subject,
            display_name=u.display_name,
            email=u.email,
            role=u.role,
            organization_id=u.organization_id,
            organization_name=org_name,
            created_at=u.created_at,
            updated_at=u.updated_at,
        ))
    
    return result


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Получить информацию о пользователе."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    org_name = None
    if u.organization_id:
        org = db.query(Organization).filter(Organization.id == u.organization_id).first()
        if org:
            org_name = org.name
    
    return UserOut(
        id=u.id,
        external_subject=u.external_subject,
        display_name=u.display_name,
        email=u.email,
        role=u.role,
        organization_id=u.organization_id,
        organization_name=org_name,
        created_at=u.created_at,
        updated_at=u.updated_at,
    )
