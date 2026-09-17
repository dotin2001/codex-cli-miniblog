## Why

Railway is returning `500` for `GET /blogs` because the running API code eager-loads `Blog.tags` through the `blog_tags` association table, but the connected MySQL database does not have that table. MiniBlog already has migrations for `tags` and `blog_tags`, so the failure indicates deployment schema drift: the API is serving traffic before the required migrations have been applied, or the deployment is not using the migration-running startup path.

## What Changes

- Add an explicit backend runtime readiness requirement that the container applies pending Flask-Migrate migrations before Gunicorn accepts traffic.
- Add a deploy-time guard or verification path that fails loudly when migration startup has been bypassed or schema drift leaves required tag tables unavailable.
- Add targeted coverage for the Railway/Docker startup configuration so future changes do not accidentally start Gunicorn directly.
- Document the operational diagnosis and recovery path for a deployed database missing `tags` or `blog_tags`.
- Do not change the public `/blogs` API contract, tag request/response shapes, or frontend tag behavior.

## Capabilities

### New Capabilities

- `backend-runtime-schema-readiness`: Backend deployment startup, migration readiness, and schema-drift diagnostics for migration-owned tables required by served API routes.

### Modified Capabilities

- None.

## Impact

- Backend runtime startup files such as `Dockerfile`, `railway.json`, `apps/api/start-api.sh`, and possibly `apps/api/Procfile`.
- Backend tests or static configuration checks under `apps/api/tests`.
- Shared operational/database documentation in `docs/database.md` or related runtime docs.
- No new runtime services, public endpoints, API response contract changes, database tables, or third-party dependencies are expected.
