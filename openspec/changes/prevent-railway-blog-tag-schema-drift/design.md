## Context

See `proposal.md` for motivation. The backend model already defines `Blog.tags`
through `blog_tags`, and migrations `20260915_0005_add_blog_tags.py` and
`20260917_0006_repair_blog_tag_tables.py` create or repair the `tags` and
`blog_tags` schema. `apps/api/start-api.sh` runs `flask --app app db upgrade`
with retries before `exec gunicorn`, and both the root `Dockerfile` and
`railway.json` currently point at that script. The reported Railway log starts
Gunicorn and then fails inside `GET /blogs`, which is consistent with a
deployment that is bypassing migration startup, using a stale image/config, or
connecting to a database whose migrations were not applied.

## Goals / Non-Goals

**Goals:**

- Preserve a single migration-ready startup path for container deployments.
- Add regression coverage that catches accidental direct-Gunicorn startup in
  Railway, Docker, or Procfile configuration.
- Improve operator documentation for the exact `blog_tags` missing-table
  symptom and recovery steps.
- Keep verification possible without requiring live Railway access or committed
  database credentials.

**Non-Goals:**

- Do not change blog tag schema, tag API behavior, or frontend tag UI.
- Do not create missing production tables from request handlers.
- Do not introduce a new migration runner service, task queue, or dependency.
- Do not commit Railway secrets or resolved database URLs.

## Decisions

### Keep startup migrations in `apps/api/start-api.sh`

The startup script remains the deployment gate: it retries `flask --app app db
upgrade`, exits non-zero when migrations keep failing, and only then starts
Gunicorn. This keeps local Docker, Railway Dockerfile deployments, and Procfile
deployments aligned around one behavior.

Alternative considered: run Gunicorn directly and add a route-time schema check.
That would still allow the container to be marked live with an unusable schema
and would make a database migration problem appear as an API error.

### Add static regression tests for deployment entrypoints

Add a backend test module that reads `railway.json`, the root `Dockerfile`,
`apps/api/Dockerfile`, `apps/api/Procfile`, and `apps/api/start-api.sh`. The
tests should assert that deployment entrypoints invoke `start-api.sh`, and that
`start-api.sh` runs `flask --app app db upgrade` before `gunicorn`.

Alternative considered: integration-test the full container boot. That would be
stronger but heavier, depends on Docker availability, and is unnecessary for
catching the configuration drift that caused this failure mode.

### Document diagnosis and recovery instead of adding automatic table creation

Update `docs/database.md` or a nearby runtime doc to name the observed symptom:
`pymysql.err.ProgrammingError: (1146, "Table 'railway.blog_tags' doesn't
exist")` during `GET /blogs`. The guidance should direct operators to confirm
Railway uses `sh ./start-api.sh`, redeploy the current image, and run/apply
pending migrations against the connected MySQL database when needed.

Alternative considered: call `db.create_all()` on startup as a repair path. That
would bypass Alembic history, hide migration failures, and risk producing schema
drift that future migrations cannot reason about.

## Risks / Trade-offs

- Static tests cannot prove Railway actually used the latest deployed config ->
  Mitigation: document checking the Railway Variables/Settings UI and deploy
  logs for the startup script messages.
- A migration can fail for data or permission reasons even when the correct
  startup command runs -> Mitigation: keep startup fail-closed and surface the
  migration failure in logs before Gunicorn starts.
- Existing Railway services can retain an overridden custom start command ->
  Mitigation: include that as a first-class recovery step in docs.
- Live database verification may not be available in local CI -> Mitigation:
  make static checks mandatory and leave live `flask --app app db upgrade`
  verification as an environment-dependent operational step.

## Migration Plan

1. Add deployment entrypoint regression tests under `apps/api/tests`.
2. Update runtime/database documentation with the missing `blog_tags` diagnosis,
   likely causes, and recovery checklist.
3. Run backend unit tests.
4. If a MySQL database is available, run `flask --app app db upgrade` from
   `apps/api` against the target database or verify Railway deploy logs show
   `Database migrations are up to date.` before Gunicorn starts.

Rollback is low-risk: revert the tests and documentation. No schema or API
rollback is involved.
