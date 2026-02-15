from __future__ import annotations

import asyncio
import os
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.db.base import Base

# Use test database
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://bikeroutes:bikeroutes@localhost:5432/bikeroutes_test"
)

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session")
async def db_engine():
    """Create test database engine and tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with overridden DB dependency."""
    from app.db import get_db
    
    app = create_app()
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client(client) -> tuple[AsyncClient, dict]:
    """Create authenticated client with test user."""
    # Register test user
    response = await client.post(
        "/api/auth/register",
        json={"email": f"test_{uuid.uuid4()}@example.com", "password": "TestPassword123!"}
    )
    data = response.json()
    return client, {"Authorization": f"Bearer {data['access_token']}"}
