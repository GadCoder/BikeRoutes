from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import RefreshToken, User
from app.auth.passwords import hash_password, verify_password
from app.auth.tokens import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expires_at,
)
from app.db import get_db

router = APIRouter(prefix="/auth")


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=4096)


class UserOut(BaseModel):
    id: str
    email: str


class SessionOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def _issue_session(*, db: AsyncSession, user: User) -> SessionOut:
    access_token = create_access_token(user_id=user.id)
    refresh_plain, refresh_hash = generate_refresh_token()

    rt = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=refresh_expires_at(),
    )
    db.add(rt)
    await db.commit()
    return SessionOut(
        access_token=access_token,
        refresh_token=refresh_plain,
        user=UserOut(id=str(user.id), email=user.email),
    )


@router.post("/register", response_model=SessionOut)
async def register(
    payload: RegisterRequest, db: AsyncSession = Depends(get_db)
) -> SessionOut:
    email = payload.email.strip().lower()
    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="email_already_registered"
        )

    await db.refresh(user)
    return await _issue_session(db=db, user=user)


@router.post("/login", response_model=SessionOut)
async def login(
    payload: LoginRequest, db: AsyncSession = Depends(get_db)
) -> SessionOut:
    email = payload.email.strip().lower()
    user = await db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="inactive_user"
        )
    return await _issue_session(db=db, user=user)


@router.post("/refresh", response_model=SessionOut)
async def refresh(
    payload: RefreshRequest, db: AsyncSession = Depends(get_db)
) -> SessionOut:
    now = datetime.now(timezone.utc)
    incoming_hash = hash_refresh_token(payload.refresh_token)

    rt = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == incoming_hash)
    )
    if rt is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_refresh_token"
        )

    # If a rotated/revoked token is reused, revoke all active refresh tokens for that user.
    if rt.revoked_at is not None or rt.replaced_by_token_id is not None:
        await db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == rt.user_id, RefreshToken.revoked_at.is_(None)
            )
            .values(revoked_at=now, revoked_reason="reuse")
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="refresh_reuse_detected"
        )

    if _as_utc(rt.expires_at) <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="refresh_expired"
        )

    user = await db.scalar(select(User).where(User.id == rt.user_id))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="user_not_found"
        )

    new_refresh_plain, new_refresh_hash = generate_refresh_token()
    new_rt = RefreshToken(
        user_id=user.id,
        token_hash=new_refresh_hash,
        expires_at=refresh_expires_at(),
    )
    db.add(new_rt)
    await db.flush()

    rt.revoked_at = now
    rt.revoked_reason = "rotated"
    rt.replaced_by_token_id = new_rt.id

    await db.commit()

    return SessionOut(
        access_token=create_access_token(user_id=user.id),
        refresh_token=new_refresh_plain,
        user=UserOut(id=str(user.id), email=user.email),
    )


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=str(user.id), email=user.email)
