from __future__ import annotations

import uuid

from fastapi import Header, HTTPException, Request, status

from app.auth.contracts import UserPrincipal
from app.core.settings import settings


async def get_optional_current_user(
    request: Request,
    x_debug_user_id: str | None = Header(default=None),
) -> UserPrincipal | None:
    """
    Temporary auth contract for Track C implementation.

    Agent B will implement real JWT auth and should set a principal on request state.
    Until then, we support an opt-in debug header in *development* only.
    """
    principal = getattr(request.state, "user", None)
    if isinstance(principal, UserPrincipal):
        return principal

    # Prevent accidental impersonation in staging-like environments.
    if settings.app_env == "development" and x_debug_user_id:
        try:
            return UserPrincipal(id=uuid.UUID(x_debug_user_id))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Debug-User-Id header",
            ) from e

    return None


async def get_current_user(
    request: Request,
    x_debug_user_id: str | None = Header(default=None),
) -> UserPrincipal:
    user = await get_optional_current_user(request, x_debug_user_id=x_debug_user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user
