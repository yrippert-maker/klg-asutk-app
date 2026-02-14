from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings

# DEV bypass: включается ТОЛЬКО если ENABLE_DEV_AUTH=true
ENABLE_DEV_AUTH = os.getenv("ENABLE_DEV_AUTH", "false").strip().lower() == "true"
_DEV_TOKEN_NORM = (os.getenv("DEV_TOKEN") or "dev").strip().lower()


def _is_dev_token(t: str) -> bool:
    if not ENABLE_DEV_AUTH:
        return False
    return (t or "").strip().lower() == _DEV_TOKEN_NORM


@dataclass
class TokenUser:
    sub: str
    display_name: str
    email: str | None
    role: str
    org_id: str | None


class AuthError(Exception):
    pass


_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    jwks_url = getattr(settings, "OIDC_JWKS_URL", None) or settings.OIDC_JWKS_URL
    if not jwks_url:
        raise AuthError("OIDC_JWKS_URL not configured")
    timeout = getattr(settings, "OIDC_TIMEOUT_S", 20)
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.get(jwks_url)
        r.raise_for_status()
        _jwks_cache = r.json()
        return _jwks_cache


async def decode_token(token: str) -> dict[str, Any]:
    """Validate and decode JWT.

    Production: validate against OIDC JWKS from ASU TK-IB.
    Dev: may accept HS256 using jwt_secret when ENABLE_DEV_AUTH=true.
    """
    if _is_dev_token(token):
        return {"sub": "dev", "name": "Dev User", "email": "dev@local", "role": "admin", "org_id": None}

    if ENABLE_DEV_AUTH and getattr(settings, "allow_hs256_dev_tokens", False):
        try:
            secret = getattr(settings, "JWT_SECRET", "")
            alg = getattr(settings, "JWT_ALG", "HS256")
            if secret:
                return jwt.decode(token, secret, algorithms=[alg], options={"verify_aud": False})
        except JWTError:
            pass

    jwks = await _get_jwks()
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            raise AuthError("Unknown key id")
        return jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            issuer=settings.OIDC_ISSUER,
            audience=getattr(settings, "OIDC_AUDIENCE", "account"),
        )
    except JWTError as e:
        raise AuthError("Invalid token") from e


def token_to_user(claims: dict[str, Any]) -> TokenUser:
    role = claims.get("role") or claims.get("realm_access", {}).get("roles", [None])[0] or "operator_user"
    return TokenUser(
        sub=str(claims.get("sub")),
        display_name=str(claims.get("name") or claims.get("preferred_username") or claims.get("sub")),
        email=claims.get("email"),
        role=str(role),
        org_id=claims.get("org_id"),
    )
