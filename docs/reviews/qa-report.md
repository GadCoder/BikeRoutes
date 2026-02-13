# QA Report (Intensive) - BikeRoutes

Date: 2026-02-13

Branch: `agent/qa-intensive`
Commit under test: `99ccbfa2262ad012f380af44d1950aa1a3df1054`

## Environment Notes (This QA Run)

- Network access (DNS/HTTPS) appears blocked in this environment. Attempts to `pip install` / `npm install` could not reach registries.
- `uv` is not installed on PATH in this environment.
- `adb` binary exists, but starting the daemon failed with `Operation not permitted` when attempting to install the smartsocket listener on `tcp:5037`.

## Backend

### Fresh venv + install (`backend/requirements.txt`)

Attempted:

- `python3 -m venv .venv-qa`
- `. .venv-qa/bin/activate`
- `python -m pip install -U pip setuptools wheel`
- `python -m pip install -r backend/requirements.txt`

Result:

- Blocked: `pip` could not reach package index due to DNS/network restrictions (error: no matching distribution found for `setuptools` after retries).

### `python -m compileall backend/app`

- `python3 -m compileall backend/app -q`
- Result: PASS (no syntax/compile errors detected).

### Alembic Heads (single head)

Unable to run `alembic heads` (dependency install blocked).

Fallback validation: parsed `backend/alembic/versions/*.py` metadata (`revision` / `down_revision`) to compute heads.

- Result: single head found: `ce2e3d9acf16`
- Migration files observed: 3

### Backend Unit Tests (pytest)

Test presence:

- Found: `backend/tests/test_auth.py` (async tests using FastAPI ASGI, SQLAlchemy async engine, aiosqlite, httpx, pytest-asyncio)

Execution:

- Blocked: cannot run without installing backend dependencies.

### Uvicorn smoke (`/healthz`, `/api`)

Unable to start server due to missing dependencies.

Static confirmation:

- `backend/app/main.py` defines `GET /healthz` returning `{ "status": "ok", "env": settings.app_env }`.
- API router is included at prefix `/api`.

## Mobile (frontend/mobile)

### TypeScript / lint

- `frontend/mobile/package.json` is an Expo app (`expo start` scripts).
- `frontend/mobile/tsconfig.json` exists and is valid JSON (extends `expo/tsconfig.base`).
- No repo-local TypeScript checks could be executed due to missing `node_modules` and blocked `npm install`.

### Install / build sanity

Attempted:

- `npm install --workspaces --no-audit --no-fund`

Result:

- Did not complete in this environment (likely blocked waiting on network access to npm registry).

### Emulator / adb / Genymotion

- `adb` is installed, but `adb devices -l` failed to start the daemon with an `Operation not permitted` error on the smartsocket listener.
- No Genymotion binaries were found on PATH (`genymotion` not detected).

## Findings

### MUST FIX

- None found in repository code via the checks that were able to run in this environment.

### SHOULD FIX

- Dependency management / reproducibility:
  - `backend/requirements.txt` is unpinned while `backend/pyproject.toml` pins some deps; `backend/requirements.lock` exists but shows different versions than `backend/pyproject.toml`. This is likely to cause “works on my machine” drift depending on install method.
- Tooling/documentation mismatch:
  - `backend/requirements.lock` header comment claimed it was generated with `-o uv.lock` while the file is named `requirements.lock`. (Fixed in this branch.)

### NICE TO HAVE

- Add an offline-friendly developer/CI path (or document expected network access) for Python + Node dependency installs in constrained environments.
- Add explicit mobile `typecheck` and/or `lint` scripts in `frontend/mobile/package.json` (if intended).

