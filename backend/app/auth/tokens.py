from __future__ import annotations

import secrets
from datetime import datetime, timezone, timedelta
from typing import Tuple

from app.auth.jwt import create_access_token, decode_access_token
from app.core.settings import settings


# Re-export JWT functions
__all__ = [
    "create_access_token",
    "decode_access_token",
    "generate_refresh_token",
    "hash_refresh_token",
    "refresh_expires_at",
]


def generate_refresh_token() -> Tuple[str, str]:
    """Generate a refresh token and its hash."""
    token = secrets.token_urlsafe(32)
    token_hash = hash_refresh_token(token)
    return token, token_hash


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token for storage."""
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_expires_at(days: int = None) -> datetime:
    """Calculate refresh token expiration."""
    days = days or settings.refresh_token_ttl_days
    return datetime.now(timezone.utc) + timedelta(days=days)
