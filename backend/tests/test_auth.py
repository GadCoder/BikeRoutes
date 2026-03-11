from __future__ import annotations

import uuid

import pytest

from app.auth.google import GoogleIdentity, GoogleTokenVerificationError
from app.auth.models import User


def _mock_google_verifier(monkeypatch, *, identity: GoogleIdentity | None = None, error: str | None = None) -> None:
    def _verify(_: str) -> GoogleIdentity:
        if error is not None:
            raise GoogleTokenVerificationError(error)
        assert identity is not None
        return identity

    monkeypatch.setattr("app.api.auth.verify_google_id_token", _verify)


@pytest.mark.asyncio
async def test_google_exchange_creates_session_and_supports_me(client, monkeypatch):
    identity = GoogleIdentity(
        sub=f"sub-{uuid.uuid4()}",
        email="rider@example.com",
        email_verified=True,
        issuer="https://accounts.google.com",
        audience="test-client-id",
    )
    _mock_google_verifier(monkeypatch, identity=identity)

    response = await client.post("/api/auth/google", json={"id_token": "fake-token"})
    assert response.status_code == 200, response.text
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "rider@example.com"

    me = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me.status_code == 200, me.text
    assert me.json()["email"] == "rider@example.com"


@pytest.mark.asyncio
async def test_google_exchange_links_existing_user_by_email(client, db_session, monkeypatch):
    existing = User(email="existing@example.com", password_hash="!", google_sub=None)
    db_session.add(existing)
    await db_session.commit()

    identity = GoogleIdentity(
        sub="google-sub-123",
        email="existing@example.com",
        email_verified=True,
        issuer="https://accounts.google.com",
        audience="test-client-id",
    )
    _mock_google_verifier(monkeypatch, identity=identity)

    response = await client.post("/api/auth/google", json={"id_token": "fake-token"})
    assert response.status_code == 200, response.text

    await db_session.refresh(existing)
    assert existing.google_sub == "google-sub-123"


@pytest.mark.asyncio
async def test_google_exchange_rejects_invalid_token(client, monkeypatch):
    _mock_google_verifier(monkeypatch, error="invalid_google_token_claims")

    response = await client.post("/api/auth/google", json={"id_token": "bad-token"})
    assert response.status_code == 401, response.text
    assert response.json()["detail"] == "invalid_google_token_claims"


@pytest.mark.asyncio
async def test_legacy_password_endpoints_disabled(client):
    register = await client.post(
        "/api/auth/register",
        json={"email": "legacy@example.com", "password": "StrongPassword123!"},
    )
    assert register.status_code == 410, register.text
    assert register.json()["detail"] == "password_auth_disabled"

    login = await client.post(
        "/api/auth/login",
        json={"email": "legacy@example.com", "password": "StrongPassword123!"},
    )
    assert login.status_code == 410, login.text
    assert login.json()["detail"] == "password_auth_disabled"
