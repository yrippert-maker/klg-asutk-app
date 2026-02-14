"""
Shared CRUD helpers for all API routes.
DRY: tenant filtering, audit logging, pagination, access checks.
Part-M-RU M.A.305: all changes must be logged.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session, Query

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------
def audit(
    db: Session, user, action: str, entity_type: str,
    entity_id: str | None = None, changes: dict | None = None,
    description: str | None = None, ip: str | None = None,
):
    """Write an audit trail entry. Call BEFORE db.commit()."""
    db.add(AuditLog(
        user_id=user.id,
        user_email=getattr(user, "email", None),
        user_role=getattr(user, "role", None),
        organization_id=getattr(user, "organization_id", None),
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes,
        description=description,
        ip_address=ip,
    ))


def diff_changes(obj, data: dict) -> dict:
    """Compute {field: {old, new}} diff between ORM object and incoming data."""
    changes = {}
    for k, v in data.items():
        old = getattr(obj, k, None)
        if old != v:
            changes[k] = {"old": str(old) if old is not None else None, "new": str(v) if v is not None else None}
    return changes


# ---------------------------------------------------------------------------
# Tenant / access
# ---------------------------------------------------------------------------
def is_operator(user) -> bool:
    return getattr(user, "role", "").startswith("operator")


def is_mro(user) -> bool:
    return getattr(user, "role", "").startswith("mro")


def is_authority(user) -> bool:
    return getattr(user, "role", "") in ("admin", "authority_inspector")


def check_aircraft_access(db: Session, user, aircraft_id: str):
    """Verify user has access to the given aircraft. Raises 403/404."""
    from app.models import Aircraft
    a = db.query(Aircraft).filter(Aircraft.id == aircraft_id).first()
    if not a:
        raise HTTPException(404, "Aircraft not found")
    if is_operator(user) and user.organization_id and a.operator_id != user.organization_id:
        raise HTTPException(403, "Forbidden")
    return a


def check_org_access(user, org_id: str):
    """Verify user has access to the given organization. Raises 403."""
    if not is_authority(user) and user.organization_id != org_id:
        raise HTTPException(403, "Forbidden")


def filter_by_org(query: Query, model, user, org_field: str = "operator_id"):
    """Apply tenant filter to a query (operators see only their org)."""
    if is_operator(user) and user.organization_id:
        return query.filter(getattr(model, org_field) == user.organization_id)
    return query


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------
def paginate_query(query: Query, page: int = 1, per_page: int = 25) -> dict:
    """Apply pagination and return standard response dict."""
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = (total + per_page - 1) // per_page if total > 0 else 0
    return {"items": items, "total": total, "page": page, "per_page": per_page, "pages": pages}


# ---------------------------------------------------------------------------
# Org name helper
# ---------------------------------------------------------------------------
_org_cache: dict[str, str | None] = {}

def get_org_name(db: Session, org_id: str | None) -> str | None:
    """Get organization name by ID (with in-request caching)."""
    if not org_id:
        return None
    if org_id not in _org_cache:
        from app.models import Organization
        org = db.query(Organization).filter(Organization.id == org_id).first()
        _org_cache[org_id] = org.name if org else None
    return _org_cache.get(org_id)


def require_roles(*roles):
    """Dependency factory for role-based access control"""
    from fastapi import Depends
    from app.api.deps import get_current_user
    async def role_checker(user=Depends(get_current_user)):
        if hasattr(user, "role") and user.role not in roles:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
