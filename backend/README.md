# Backend

FastAPI service (MVP skeleton).

Local dev:

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload
```

Google-only auth environment:

- `GOOGLE_CLIENT_IDS`: comma-separated OAuth client IDs allowed at `/api/auth/google` (web + mobile IDs).
- `GOOGLE_JWKS_URL`: JWKS endpoint used for Google token signature validation.
- `GOOGLE_ISSUERS`: comma-separated allowed token issuers (default includes both Google issuer forms).
