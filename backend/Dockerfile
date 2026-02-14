FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN python -m pip install --no-cache-dir uv

COPY requirements.txt ./requirements.txt
RUN uv pip install --system -r requirements.txt

COPY . .

EXPOSE 8000

# In prod, we want schema migrations applied automatically.
# Dokploy/Swarm sometimes starts the app before Postgres is ready; wait briefly before migrating.
# NOTE: keep this POSIX-sh compatible (Dokploy uses /bin/sh).
CMD ["/bin/sh", "-lc", "set -e\npython - <<'PY'\nimport os, time\nimport psycopg\n\nurl=os.environ.get('DATABASE_URL','')\n# Use sync driver for readiness checks.\nurl=url.replace('postgresql+asyncpg://','postgresql://',1)\nurl=url.replace('postgresql+psycopg://','postgresql://',1)\n\nlast=None\nfor _ in range(60):\n    try:\n        psycopg.connect(url, connect_timeout=2).close()\n        print('db ready')\n        break\n    except Exception as e:\n        last=e\n        time.sleep(1)\nelse:\n    raise SystemExit(f'db not ready after 60s: {last}')\nPY\nalembic upgrade head\nexec uvicorn app.main:app --host 0.0.0.0 --port 8000"]

