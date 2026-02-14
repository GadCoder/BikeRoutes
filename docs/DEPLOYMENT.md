# Deployment (Dokploy)

This repo is designed to be deployed with **Dokploy**.

## Services
- **Postgres/PostGIS** (DB)
- **Backend API** (FastAPI)
- **Web** (Vite build served as static files)

## Environment variables
### Backend
- `DATABASE_URL` (asyncpg SQLAlchemy URL)
- `CORS_ORIGINS` (comma-separated list)
- `APP_ENV` (production|development)

### Web
- `VITE_API_URL` (e.g. `https://api.bikeroutes.example.com`)

## Dokploy layout (recommended)
- Project: `BikeRoutes`
- Env: `prod`
- Service: `db` (Postgres/PostGIS)
- App: `backend` (Dockerfile: `backend/Dockerfile`)
- App: `web` (Dockerfile: `frontend/web/Dockerfile`)

## Domains
- `api.<domain>` -> backend app (port 8000)
- `<domain>` -> web app (port 80)

## Notes
- Backend container runs `alembic upgrade head` on boot.
- For local production-ish testing, see `infra/docker-compose.prod.yml`.
