from __future__ import annotations

import json
import threading
import time
from dataclasses import dataclass
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from jose import JWTError, jwt

from app.core.settings import settings

_JWKS_CACHE: dict[str, dict[str, Any]] = {}
_JWKS_EXPIRES_AT: float = 0.0
_JWKS_LOCK = threading.Lock()


class GoogleTokenVerificationError(ValueError):
    """Raised when a Google ID token cannot be verified."""


@dataclass(frozen=True, slots=True)
class GoogleIdentity:
    sub: str
    email: str
    email_verified: bool
    issuer: str
    audience: str


def _parse_max_age(cache_control: str) -> int:
    for part in cache_control.split(","):
        key, _, value = part.strip().partition("=")
        if key.lower() == "max-age":
            try:
                return max(0, int(value))
            except ValueError:
                return 300
    return 300


def _fetch_google_jwks() -> tuple[dict[str, dict[str, Any]], float]:
    request = Request(settings.google_jwks_url, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=5) as response:  # noqa: S310
            body = response.read()
            cache_control = response.headers.get("Cache-Control", "")
    except URLError as exc:
        raise GoogleTokenVerificationError("google_jwks_unavailable") from exc

    payload = json.loads(body)
    keys = payload.get("keys")
    if not isinstance(keys, list):
        raise GoogleTokenVerificationError("invalid_google_jwks")

    by_kid: dict[str, dict[str, Any]] = {}
    for key in keys:
        kid = key.get("kid")
        if isinstance(kid, str) and kid:
            by_kid[kid] = key

    if not by_kid:
        raise GoogleTokenVerificationError("invalid_google_jwks")

    max_age = _parse_max_age(cache_control)
    return by_kid, time.time() + max_age


def _get_jwks(*, force_refresh: bool = False) -> dict[str, dict[str, Any]]:
    global _JWKS_CACHE, _JWKS_EXPIRES_AT

    with _JWKS_LOCK:
        if not force_refresh and _JWKS_CACHE and time.time() < _JWKS_EXPIRES_AT:
            return _JWKS_CACHE

        keys, expires_at = _fetch_google_jwks()
        _JWKS_CACHE = keys
        _JWKS_EXPIRES_AT = expires_at
        return _JWKS_CACHE


def _audiences_from_claim(claim: Any) -> set[str]:
    if isinstance(claim, str):
        return {claim}
    if isinstance(claim, list):
        return {item for item in claim if isinstance(item, str)}
    return set()


def _to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return False


def verify_google_id_token(id_token: str) -> GoogleIdentity:
    allowed_client_ids = set(settings.google_client_id_list)
    if not allowed_client_ids:
        raise GoogleTokenVerificationError("google_client_ids_not_configured")

    allowed_issuers = set(settings.google_issuer_list)
    if not allowed_issuers:
        raise GoogleTokenVerificationError("google_issuers_not_configured")

    try:
        headers = jwt.get_unverified_header(id_token)
    except JWTError as exc:
        raise GoogleTokenVerificationError("invalid_google_token_header") from exc

    kid = headers.get("kid")
    alg = headers.get("alg")
    if not isinstance(kid, str) or not kid:
        raise GoogleTokenVerificationError("invalid_google_token_header")
    if alg != "RS256":
        raise GoogleTokenVerificationError("invalid_google_token_alg")

    jwks = _get_jwks()
    signing_key = jwks.get(kid)
    if signing_key is None:
        signing_key = _get_jwks(force_refresh=True).get(kid)
    if signing_key is None:
        raise GoogleTokenVerificationError("unknown_google_signing_key")

    try:
        claims = jwt.decode(
            id_token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise GoogleTokenVerificationError("invalid_google_token_claims") from exc

    issuer = claims.get("iss")
    if not isinstance(issuer, str) or issuer not in allowed_issuers:
        raise GoogleTokenVerificationError("invalid_google_issuer")

    claim_audiences = _audiences_from_claim(claims.get("aud"))
    if not claim_audiences.intersection(allowed_client_ids):
        raise GoogleTokenVerificationError("invalid_google_audience")

    sub = claims.get("sub")
    email = claims.get("email")
    if not isinstance(sub, str) or not sub:
        raise GoogleTokenVerificationError("invalid_google_subject")
    if not isinstance(email, str) or not email:
        raise GoogleTokenVerificationError("invalid_google_email")

    email_verified = _to_bool(claims.get("email_verified"))
    if not email_verified:
        raise GoogleTokenVerificationError("google_email_not_verified")

    return GoogleIdentity(
        sub=sub,
        email=email.strip().lower(),
        email_verified=email_verified,
        issuer=issuer,
        audience=next(iter(claim_audiences.intersection(allowed_client_ids))),
    )
