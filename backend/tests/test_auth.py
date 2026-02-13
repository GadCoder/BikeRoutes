from __future__ import annotations

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.auth import router as auth_router
from app.auth.models import Base
from app.db import get_db


@pytest.fixture()
async def test_app():
    engine = create_async_engine(
        "sqlite+aiosqlite:///file::memory:?cache=shared",
        connect_args={"uri": True},
    )
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        # Only auth tables are present in this test app; avoid importing geo/routes.
        await conn.run_sync(Base.metadata.create_all)

    app = FastAPI(title="BikeRoutes API (test)")
    app.include_router(auth_router, prefix="/api", tags=["auth"])

    async def override_get_db():
        async with SessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    yield app

    await engine.dispose()


@pytest.mark.asyncio
async def test_register_then_me_happy_path(test_app):
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        r = await client.post(
            "/api/auth/register",
            json={"email": "rider@example.com", "password": "correct horse battery staple"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "rider@example.com"

        me = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        assert me.status_code == 200, me.text
        me_data = me.json()
        assert me_data["email"] == "rider@example.com"


@pytest.mark.asyncio
async def test_refresh_reuse_revokes_session(test_app):
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        r = await client.post(
            "/api/auth/register",
            json={"email": "reuse@example.com", "password": "correct horse battery staple"},
        )
        assert r.status_code == 200, r.text
        first = r.json()

        rotated = await client.post("/api/auth/refresh", json={"refresh_token": first["refresh_token"]})
        assert rotated.status_code == 200, rotated.text
        second = rotated.json()

        # Re-using a rotated token should fail...
        reused = await client.post("/api/auth/refresh", json={"refresh_token": first["refresh_token"]})
        assert reused.status_code == 401

        # ...and revoke the currently active refresh token (require re-auth).
        still_ok = await client.post("/api/auth/refresh", json={"refresh_token": second["refresh_token"]})
        assert still_ok.status_code == 401
