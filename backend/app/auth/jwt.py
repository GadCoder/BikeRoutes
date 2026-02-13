from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any


class JWTError(Exception):
    pass


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    pad = "=" * ((4 - (len(s) % 4)) % 4)
    return base64.urlsafe_b64decode((s + pad).encode("ascii"))


def _sign_hs256(message: bytes, secret: str) -> bytes:
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).digest()


def encode_hs256(payload: dict[str, Any], secret: str) -> str:
    header = {"typ": "JWT", "alg": "HS256"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    sig_b64 = _b64url_encode(_sign_hs256(signing_input, secret))
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_hs256(token: str, secret: str) -> dict[str, Any]:
    try:
        header_b64, payload_b64, sig_b64 = token.split(".", 2)
    except ValueError as e:
        raise JWTError("invalid_token") from e

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected = _sign_hs256(signing_input, secret)
    try:
        got = _b64url_decode(sig_b64)
    except Exception as e:
        raise JWTError("invalid_token") from e

    if not hmac.compare_digest(expected, got):
        raise JWTError("invalid_signature")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception as e:
        raise JWTError("invalid_payload") from e

    exp = payload.get("exp")
    if exp is not None:
        try:
            exp_dt = datetime.fromtimestamp(int(exp), tz=timezone.utc)
        except Exception as e:
            raise JWTError("invalid_exp") from e
        if datetime.now(timezone.utc) >= exp_dt:
            raise JWTError("expired")

    if not isinstance(payload, dict):
        raise JWTError("invalid_payload")
    return payload

