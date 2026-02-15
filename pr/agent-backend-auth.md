## 1. Summary
Add backend auth API (register/login/refresh/me) with JWT-based current-user dependency and refresh token rotation.

## 2. Why
Routes/markers mutation endpoints need a shared `get_current_user` dependency for ownership enforcement, and the mobile/web clients need a working access+refresh token flow for session bootstrap and continuity.

## 3. What Changed
- Added `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me` endpoints (`backend/app/api/auth.py`) and wired them into the API router (`backend/app/api/router.py`).
- Implemented `get_current_user` (JWT Bearer) dependency for other modules to import (`backend/app/auth/deps.py`, `backend/app/auth/__init__.py`).
- Implemented access JWT encode/verify (HS256) and PBKDF2 password hashing using stdlib (`backend/app/auth/jwt.py`, `backend/app/auth/passwords.py`, `backend/app/auth/tokens.py`).
- Implemented refresh token hashing + rotation and revoke-on-reuse behavior backed by the `refresh_tokens` table (`backend/app/api/auth.py`, `backend/app/auth/models.py`, `backend/alembic/versions/20260213_0001_create_users_and_refresh_tokens.py`).
- Added minimal endpoint tests (happy path + refresh reuse failure path) (`backend/tests/test_auth.py`) and updated OpenSpec task checkboxes (`openspec/changes/bootstrap-bike-routes-mvp/tasks.md`).

## 4. Considerations
- `JWT_SECRET` should be set in environment for any non-dev deployment; default is intentionally insecure (`.env.example`, `backend/app/core/settings.py`).
- Refresh token reuse revokes all active refresh tokens for that user (forces re-auth across sessions) by design.
- Tests use SQLite via `aiosqlite` as a dev dependency (`backend/pyproject.toml`).
- No breaking changes.

