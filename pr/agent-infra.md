## 1. Summary
Bootstrap BikeRoutes MVP repo structure + local dev infra (compose, skeleton apps).

## 2. Why
Unblock parallel workstreams by standardizing paths, environment variables, and local run commands across web/mobile/backend.

## 3. What Changed
- Added baseline monorepo directories: `frontend/web`, `frontend/mobile`, `frontend/shared`, `backend`, `infra`, `maps`.
- Added local environment template: `.env.example`.
- Added `docker-compose.yml` with PostGIS (`db`), backend service, and a Martin tile server placeholder.
- Added backend FastAPI skeleton (`backend/app/*`) and `uv`-based local dev script (`scripts/dev-backend.sh`).
- Added web Vite + React + TypeScript skeleton (`frontend/web/*`).
- Added Expo mobile shell branded "BikeRoutes" with an in-app boot splash (`frontend/mobile/App.tsx`).
- Added helper scripts for local startup: `scripts/dev-compose-up.sh`, `scripts/dev-web.sh`, `scripts/dev-mobile.sh`.
- Marked OpenSpec Track A tasks `1.1–1.4` complete in `openspec/changes/bootstrap-bike-routes-mvp/tasks.md`.

## 4. Considerations
- Tile serving is a placeholder: `tiles` service mounts `./maps` but does not yet serve real datasets.
- Backend dependency management is standardized on `uv`.
- No breaking changes.

