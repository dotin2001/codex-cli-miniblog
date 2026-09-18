## Why

Railway logs now show the API failing closed with `Database schema is not ready. Missing required table(s): blog_tags, tags`, but the same logs show Gunicorn starting repeatedly with no `Running database migrations...` messages. That means the deployed service is still able to bypass the migration-running startup path, leaving the connected MySQL schema behind the running code.

## What Changes

- Harden the API container startup so repository-managed deployments run `flask --app app db upgrade` before Gunicorn even when a platform-level command would otherwise start Gunicorn directly.
- Preserve the existing schema readiness check as a fail-closed safety net after migration attempts.
- Add regression coverage that proves the root Railway image and local API image cannot be configured to skip the migration wrapper through Docker `CMD` alone.
- Improve startup logs/docs so operators can distinguish three states: migrations ran and app started, migrations failed, or schema readiness still blocked startup after migrations.
- Add a Railway recovery checklist that explicitly covers clearing custom Start Command overrides, redeploying the current image, and using a one-off migration command only when needed.
- Do not change public API behavior, frontend behavior, database schema, tag models, or migration contents.

## Capabilities

### New Capabilities

- `railway-migration-entrypoint`: Deployment startup behavior that keeps Railway/Docker API containers on the migration-running entrypoint before serving Gunicorn.

### Modified Capabilities

- None.

## Impact

- Root `Dockerfile`, `apps/api/Dockerfile`, and possibly `apps/api/start-api.sh`.
- Docker/entrypoint regression tests under `apps/api/tests`.
- Railway/runtime documentation in `docs/database.md` and `apps/api/README.md`.
- No new dependencies, public API contract changes, frontend changes, or database migrations are expected.
