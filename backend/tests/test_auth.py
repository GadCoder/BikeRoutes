"""
Auth tests using test database.

These tests use the same PostGIS test database as other integration tests,
avoiding SQLite/SpatiaLite compatibility issues.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient

from app.main import create_app
from app.db import get_db
from app.db.base import Base
from app.core.settings import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://bikeroutes:bikeroutes@localhost:5432/bikeroutes_test"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create tables, yield session, then clean up."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session) -> AsyncClient:
    """Create test client with test DB."""
    app = create_app()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_register_then_me_happy_path(client):
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
async def test_refresh_reuse_revokes_session(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": f"reuse_{uuid.uuid4()}@example.com", "password": "correct horse battery staple"},
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


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    r = await client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrongpassword"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_without_auth(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401
