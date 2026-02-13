from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://bikeroutes:bikeroutes@localhost:5432/bikeroutes"
    cors_origins: str = "http://localhost:5173"


settings = Settings()

