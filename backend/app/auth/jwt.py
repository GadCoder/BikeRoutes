from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.settings import settings


class JWTPayload(BaseModel):
    """JWT payload structure."""
    sub: str  # user_id
    exp: Optional[datetime] = None
    iat: Optional[datetime] = None
    type: str = "access"  # access or refresh


class JWTService:
    """JWT service using python-jose."""
    
    def __init__(self, secret: str, algorithm: str = "HS256"):
        self.secret = secret
        self.algorithm = algorithm
    
    def encode(
        self, 
        user_id: str, 
        expires_delta: Optional[timedelta] = None,
        token_type: str = "access"
    ) -> str:
        """Create a JWT token."""
        now = datetime.now(timezone.utc)
        
        payload: dict[str, Any] = {
            "sub": user_id,
            "iat": now,
            "type": token_type,
        }
        
        if expires_delta:
            payload["exp"] = now + expires_delta
        
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
    
    def decode(self, token: str) -> JWTPayload:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return JWTPayload(**payload)
        except JWTError as e:
            raise ValueError(f"Invalid token: {e}")
    
    def decode_without_validation(self, token: str) -> Optional[dict[str, Any]]:
        """Decode token without validation (for debugging)."""
        try:
            return jwt.get_unverified_claims(token)
        except JWTError:
            return None


# Global JWT service instance
jwt_service = JWTService(secret=settings.jwt_secret)


def create_access_token(user_id: str, expires_minutes: int = 15) -> str:
    """Create an access token for a user."""
    return jwt_service.encode(
        user_id=user_id,
        expires_delta=timedelta(minutes=expires_minutes),
        token_type="access"
    )


def decode_access_token(token: str) -> JWTPayload:
    """Decode and validate an access token."""
    payload = jwt_service.decode(token)
    
    if payload.type != "access":
        raise ValueError("Invalid token type")
    
    if payload.exp and datetime.now(timezone.utc) >= payload.exp:
        raise ValueError("Token expired")
    
    return payload
