from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import JWTError, decode_hs256
from app.auth.models import User
from app.core.settings import settings
from app.db import get_db

_bearer = HTTPBearer(auto_error=False)


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Return the authenticated User if a valid Bearer token is present, else None."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None

    token = credentials.credentials
    try:
        payload = decode_hs256(token, settings.jwt_secret)
    except JWTError:
        return None

    if payload.get("typ") != "access":
        return None

    sub = payload.get("sub")
    if not isinstance(sub, str):
        return None
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        return None

    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        return None

    return user


async def get_current_user(
    user: User | None = Depends(get_optional_current_user),
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="not_authenticated"
        )
    return user
