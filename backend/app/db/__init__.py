from __future__ import annotations

# Public DB dependency import for FastAPI routes.
# Keep this stable so `from app.db import get_db` works.

from app.db.session import get_db_session as get_db

__all__ = ["get_db"]
