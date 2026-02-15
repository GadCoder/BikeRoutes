from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.api.router import api_router
from app.core.settings import settings
from app.core.rate_limit import limiter, RateLimits


def _cors_origins_list() -> list[str]:
    raw = (settings.cors_origins or "").strip()
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]


def create_app() -> FastAPI:
    app = FastAPI(title="BikeRoutes API")
    
    # Add rate limiter
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    
    origins = _cors_origins_list()
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    app.include_router(api_router, prefix="/api")
    
    # Rate limit error handler
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": getattr(exc, "retry_after", 60)
            }
        )
    
    return app


app = create_app()


@app.api_route("/healthz", methods=["GET", "HEAD"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


@app.get("/api/rate-limits")
@limiter.limit(RateLimits.DEFAULT)
def get_rate_limits(request: Request) -> dict:
    """Get current rate limit configuration."""
    return {
        "auth": RateLimits.AUTH,
        "register": RateLimits.REGISTER,
        "default": RateLimits.DEFAULT,
        "routes_list": RateLimits.ROUTES_LIST,
        "route_detail": RateLimits.ROUTE_DETAIL,
        "create": RateLimits.CREATE,
        "update": RateLimits.UPDATE,
        "delete": RateLimits.DELETE,
    }
