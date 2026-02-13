from __future__ import annotations

from fastapi import FastAPI

from app.api.router import api_router
from app.core.settings import settings


def create_app() -> FastAPI:
    app = FastAPI(title="BikeRoutes API")
    app.include_router(api_router, prefix="/api")
    return app


app = create_app()


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}

