from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User
from app.services.security import decode_token, token_to_user, AuthError

import os

bearer = HTTPBearer(auto_error=False)

# DEV bypass: включается ТОЛЬКО если ENABLE_DEV_AUTH=true
ENABLE_DEV_AUTH = os.getenv("ENABLE_DEV_AUTH", "false").strip().lower() == "true"
DEV_TOKEN = (os.getenv("DEV_TOKEN") or "dev").strip().lower()


def _is_dev_token(t: str) -> bool:
    if not ENABLE_DEV_AUTH:
        return False
    return (t or "").strip().lower() == DEV_TOKEN


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
):
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    token = creds.credentials

    # -------- DEV BYPASS (only when ENABLE_DEV_AUTH=true) --------
    if _is_dev_token(token):
        tu = type(
            "TokenUser",
            (),
            {
                "sub": "dev",
                "display_name": "Dev User",
                "email": "dev@local",
                "role": "admin",
                "org_id": None,
            },
        )()
    else:
        try:
            claims = await decode_token(token)
        except AuthError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

        tu = token_to_user(claims)
    # ----------------------------

    user = db.query(User).filter(User.external_subject == tu.sub).first()
    if not user:
        user = User(
            external_subject=tu.sub,
            display_name=tu.display_name,
            email=tu.email,
            role=tu.role,
            organization_id=tu.org_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.display_name = tu.display_name
        user.email = tu.email
        user.role = tu.role
        user.organization_id = tu.org_id
        db.commit()

    return user


def require_roles(*roles: str):
    def _dep(user=Depends(get_current_user)):
        if user.role not in set(roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return _dep
