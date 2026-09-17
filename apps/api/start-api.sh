#!/bin/sh
set -eu

MIGRATION_RETRY_COUNT="${MIGRATION_RETRY_COUNT:-12}"
MIGRATION_RETRY_DELAY_SECONDS="${MIGRATION_RETRY_DELAY_SECONDS:-5}"

attempt=1
while [ "$attempt" -le "$MIGRATION_RETRY_COUNT" ]; do
  echo "Running database migrations before API start, attempt ${attempt}/${MIGRATION_RETRY_COUNT}..."
  if flask --app app db upgrade; then
    echo "Database migrations are up to date."
    break
  fi

  if [ "$attempt" -eq "$MIGRATION_RETRY_COUNT" ]; then
    echo "Database migrations failed after ${MIGRATION_RETRY_COUNT} attempts; refusing to start API."
    exit 1
  fi

  attempt=$((attempt + 1))
  echo "Migration attempt failed; retrying in ${MIGRATION_RETRY_DELAY_SECONDS}s..."
  sleep "$MIGRATION_RETRY_DELAY_SECONDS"
done

exec gunicorn \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --access-logfile - \
  --error-logfile - \
  "app:create_app()"
