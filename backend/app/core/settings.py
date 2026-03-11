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
    google_client_ids: str = ""
    google_jwks_url: str = "https://www.googleapis.com/oauth2/v3/certs"
    google_issuers: str = "accounts.google.com,https://accounts.google.com"

    @property
    def google_client_id_list(self) -> list[str]:
        return [cid.strip() for cid in self.google_client_ids.split(",") if cid.strip()]

    @property
    def google_issuer_list(self) -> list[str]:
        return [iss.strip() for iss in self.google_issuers.split(",") if iss.strip()]


settings = Settings()
