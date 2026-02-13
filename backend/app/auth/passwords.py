from __future__ import annotations

import hashlib
import hmac
import secrets

_PBKDF2_ALG = "sha256"
_PBKDF2_ITERS = 210_000
_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(_PBKDF2_ALG, password.encode("utf-8"), salt, _PBKDF2_ITERS)
    return f"pbkdf2_{_PBKDF2_ALG}${_PBKDF2_ITERS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iters_s, salt_hex, dk_hex = stored.split("$", 3)
        if scheme != f"pbkdf2_{_PBKDF2_ALG}":
            return False
        iters = int(iters_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
    except Exception:
        return False

    actual = hashlib.pbkdf2_hmac(_PBKDF2_ALG, password.encode("utf-8"), salt, iters)
    return hmac.compare_digest(actual, expected)

