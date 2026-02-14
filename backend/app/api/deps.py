"""
FastAPI dependencies — auth, DB, roles.
Единая точка авторизации. Использует app.services.security для JWT/OIDC.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, Header

from app.db.session import get_db
from app.core.config import settings
from app.services.security import decode_token, token_to_user, AuthError, TokenUser

ENABLE_DEV_AUTH = settings.ENABLE_DEV_AUTH
DEV_TOKEN = settings.DEV_TOKEN


class UserInfo:
    """Lightweight user object from JWT or dev auth."""

    def __init__(self, data: dict | None = None, token_user: TokenUser | None = None):
        if token_user:
            self.id = token_user.sub
            self.email = token_user.email or ""
            self.display_name = token_user.display_name
            self.role = token_user.role
            self.roles = [token_user.role]
            self.organization_id = token_user.org_id
        elif data:
            self.id = data.get("id", "")
            self.email = data.get("email", "")
            self.display_name = data.get("display_name", "")
            self.role = data.get("role", "operator_user")
            self.roles = data.get("roles", [])
            self.organization_id = data.get("organization_id")
        else:
            raise ValueError("Either data or token_user required")


async def get_current_user(authorization: str = Header(default="")) -> UserInfo:
    """Извлечь и проверить пользователя из заголовка Authorization."""
    token = authorization.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    try:
        claims = await decode_token(token)
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = token_to_user(claims)
    return UserInfo(token_user=user)


def require_roles(*allowed_roles: str):
    """Dependency: проверяет, что пользователь имеет одну из разрешённых ролей."""
    def checker(user: UserInfo = Depends(get_current_user)):
        if user.role in allowed_roles or "admin" in user.roles:
            return user
        raise HTTPException(
            status_code=403,
            detail=f"Роль {user.role} не имеет доступа. Требуется: {allowed_roles}",
        )
    return checker
