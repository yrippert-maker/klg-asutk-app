"""
FastAPI dependencies — auth, DB, roles.
Supports both DEV mode and Keycloak OIDC.
Единая точка импорта get_db для всех роутов и тестов.
"""
from fastapi import Depends, HTTPException, Header

from app.db.session import get_db
from app.core.config import settings
from app.api.oidc import verify_oidc_token, extract_user_from_claims

ENABLE_DEV_AUTH = settings.ENABLE_DEV_AUTH
DEV_TOKEN = settings.DEV_TOKEN


# Dev user fallback
DEV_USER = {
    "id": "dev-user-001",
    "email": "admin@klg.refly.ru",
    "display_name": "Dev Admin",
    "role": "admin",
    "roles": ["admin"],
    "organization_id": None,
}


class UserInfo:
    """Lightweight user object from JWT or dev auth."""
    def __init__(self, data: dict):
        self.id = data.get("id", "")
        self.email = data.get("email", "")
        self.display_name = data.get("display_name", "")
        self.role = data.get("role", "operator_user")
        self.roles = data.get("roles", [])
        self.organization_id = data.get("organization_id")


def get_current_user(authorization: str = Header(default="")) -> UserInfo:
    """Extract user from Authorization header. Supports DEV and OIDC modes."""
    token = authorization.replace("Bearer ", "").strip()

    # DEV mode
    if ENABLE_DEV_AUTH and token == DEV_TOKEN:
        return UserInfo(DEV_USER)

    # OIDC mode
    if token:
        claims = verify_oidc_token(token)
        if claims:
            return UserInfo(extract_user_from_claims(claims))

    # No valid auth
    if not ENABLE_DEV_AUTH:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Fallback to dev for convenience
    return UserInfo(DEV_USER)


def require_roles(*allowed_roles: str):
    """Dependency that checks user has one of allowed roles."""
    def checker(user: UserInfo = Depends(get_current_user)):
        if user.role in allowed_roles or "admin" in user.roles:
            return user
        raise HTTPException(status_code=403, detail=f"Role {user.role} not in {allowed_roles}")
    return checker
