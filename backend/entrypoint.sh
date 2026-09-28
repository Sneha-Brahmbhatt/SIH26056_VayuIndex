#!/bin/sh
set -e

# Run database schema initialization & seed if needed
python -m app.seed

# Start Uvicorn listening on Cloud Run PORT env var (defaults to 8000 if not set)
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
