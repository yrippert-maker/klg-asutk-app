"""
OIDC JWT verification — validates Keycloak tokens.
Falls back to DEV auth when OIDC is not configured.
"""
import logging
import os
from functools import lru_cache
from typing import Optional

import httpx
from jose import jwt, JWTError, jwk

logger = logging.getLogger(__name__)

OIDC_ISSUER = os.getenv("OIDC_ISSUER", "")
OIDC_AUDIENCE = os.getenv("OIDC_AUDIENCE", "klg-frontend")

_jwks_cache: dict = {}


@lru_cache(maxsize=1)
def get_oidc_config() -> Optional[dict]:
    """Fetch OIDC well-known configuration."""
    if not OIDC_ISSUER:
        return None
    try:
        resp = httpx.get(f"{OIDC_ISSUER}/.well-known/openid-configuration", timeout=5)
        return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch OIDC config: {e}")
        return None


def get_jwks() -> dict:
    """Fetch JSON Web Key Set from Keycloak."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    config = get_oidc_config()
    if not config:
        return {}
    try:
        resp = httpx.get(config["jwks_uri"], timeout=5)
        _jwks_cache = resp.json()
        return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        return {}


def verify_oidc_token(token: str) -> Optional[dict]:
    """
    Verify and decode a Keycloak JWT token.
    Returns decoded claims or None if invalid.
    """
    if not OIDC_ISSUER:
        return None  # OIDC not configured

    jwks = get_jwks()
    if not jwks or "keys" not in jwks:
        logger.warning("No JWKS keys available")
        return None

    try:
        # Get key ID from token header
        unverified = jwt.get_unverified_header(token)
        kid = unverified.get("kid")

        # Find matching key
        key = None
        for k in jwks["keys"]:
            if k.get("kid") == kid:
                key = k
                break

        if not key:
            logger.warning(f"No matching key found for kid={kid}")
            return None

        # Verify and decode
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=OIDC_ISSUER,
            audience=OIDC_AUDIENCE,
            options={"verify_aud": False},  # Keycloak may not include aud
        )
        return claims

    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None


def extract_user_from_claims(claims: dict) -> dict:
    """Extract user info from JWT claims."""
    roles = []
    if "realm_access" in claims:
        roles = claims["realm_access"].get("roles", [])

    return {
        "id": claims.get("sub", ""),
        "email": claims.get("email", ""),
        "display_name": claims.get("name", claims.get("preferred_username", "")),
        "role": roles[0] if roles else "operator_user",
        "roles": roles,
        "organization_id": claims.get("organization_id"),
    }
