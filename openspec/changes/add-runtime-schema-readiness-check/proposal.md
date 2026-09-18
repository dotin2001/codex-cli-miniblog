## Why

Railway is still serving API traffic while the connected MySQL database is missing `blog_tags`, causing `GET /me/blogs` to fail after login. The existing deployment configuration already points at `start-api.sh`, so the backend needs a runtime readiness guard that fails closed when migration-owned tables required by current routes are absent.

## What Changes

- Add a backend schema readiness check that verifies required migration-owned tables exist before the Flask app starts serving normal traffic in production-like environments.
- Include `tags` and `blog_tags` in the required schema set because blog serializers and list routes eager-load `Blog.tags`.
- Keep Flask-Migrate/Alembic as the only schema repair path; the readiness check reports schema drift and exits instead of creating tables.
- Allow tests to bypass the production readiness check so SQLite-backed unit tests can continue to use `db.create_all()`.
- Add targeted tests for missing required tables and for the production startup failure path.
- Update runtime/database documentation with the new readiness behavior and expected Railway logs.
- Do not change public API paths, response bodies, auth behavior, frontend behavior, or database schema.

## Capabilities

### New Capabilities

- `backend-runtime-schema-readiness`: Backend app startup behavior that refuses to serve production-like traffic when required migration-owned tables are missing.

### Modified Capabilities

- None.

## Impact

- Backend app factory and supporting runtime/config helper code under `apps/api/app`.
- Backend tests under `apps/api/tests`.
- Runtime/database documentation, likely `docs/database.md` and possibly `apps/api/README.md`.
- No new dependencies, public API contract changes, frontend changes, or migration files are expected.
