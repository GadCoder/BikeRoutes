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
- `GOOGLE_CLIENT_IDS` (comma-separated Google OAuth client IDs accepted by backend token verifier)
- `GOOGLE_JWKS_URL` (optional override, defaults to Google certs URL)
- `GOOGLE_ISSUERS` (optional override, defaults to `accounts.google.com,https://accounts.google.com`)

### Web
- `VITE_API_URL` (e.g. `https://api.bikeroutes.example.com`)
- `VITE_GOOGLE_CLIENT_ID` (Google OAuth web client ID for Google Identity Services)

### Mobile
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (Google OAuth client ID used by mobile Google sign-in integration)

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
