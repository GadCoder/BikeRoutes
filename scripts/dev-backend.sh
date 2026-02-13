#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required. Install: https://docs.astral.sh/uv/"
  exit 1
fi

uv venv
uv pip install -r requirements.txt

exec uv run uvicorn app.main:app --host "${BACKEND_HOST:-0.0.0.0}" --port "${BACKEND_PORT:-8000}" --reload

