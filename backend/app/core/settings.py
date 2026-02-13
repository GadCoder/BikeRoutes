from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://bikeroutes:bikeroutes@localhost:5432/bikeroutes"
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str = "dev-insecure-change-me"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30


settings = Settings()
