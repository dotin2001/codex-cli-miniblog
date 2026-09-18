## Context

See `proposal.md` for motivation. The backend already defines `Tag` and the `blog_tags` association table in SQLAlchemy models, and migrations `20260915_0005_add_blog_tags.py` plus `20260917_0006_repair_blog_tag_tables.py` create or repair those tables. The current `start-api.sh` runs `flask --app app db upgrade` before Gunicorn, and deployment config points at that script, but the reported Railway log shows workers serving requests while `railway.blog_tags` is still missing.

The backend app factory currently validates production JWT configuration before initializing routes. It does not verify that the connected database schema contains the tables required by the registered routes. Tests generally create isolated SQLite schemas with `db.create_all()`, so the readiness gate must be production-scoped and must not break the existing test setup.

## Goals / Non-Goals

**Goals:**

- Fail production-like backend startup before traffic when required tables are missing.
- Make the failure clear enough that Railway logs name the missing tables and point operators back to migrations.
- Keep schema repair in Alembic/Flask-Migrate.
- Preserve current backend unit test ergonomics and local development workflows.

**Non-Goals:**

- Do not create, repair, or backfill schema from the app factory.
- Do not change blog/tag routes, serializers, auth flows, or frontend behavior.
- Do not add a separate migration service or third-party dependency.
- Do not require committed Railway credentials or direct Railway access for automated tests.

## Decisions

### Add a production-scoped schema readiness helper

Add a small backend helper that reads the table names from the active SQLAlchemy engine and compares them with a required table set: `users`, `blogs`, `comments`, `tags`, and `blog_tags`. Invoke it from `create_app()` after `db.init_app(app)` and model imports, inside an app context, only when runtime config is production-like and testing is not enabled.

Rationale: the app factory runs before Gunicorn workers accept requests, so a failure there prevents the exact observed state: login can succeed but `/me/blogs` later crashes because the schema is incomplete.

Alternative considered: check only `/health`. That still lets the app boot and moves the failure into request handling; it is weaker than failing worker startup.

### Skip readiness only for Flask-Migrate commands

The readiness helper must not run while executing `flask --app app db ...` commands, because migration commands also create the Flask app and are the approved repair path for missing tables. The check should run for Gunicorn worker startup, ordinary production app startup, and production request-serving processes.

Rationale: without this exception, `flask --app app db upgrade` would be blocked by the same missing table it is supposed to create or repair.

Alternative considered: move readiness entirely into `start-api.sh` after migrations. That would protect the documented container path, but it would not protect alternate production startup paths that still instantiate the Flask app.

### Report drift, do not repair it

When required tables are missing, raise a startup `RuntimeError` listing the missing tables and instructing the operator to run `flask --app app db upgrade` through the normal startup path.

Rationale: `db.create_all()` or ad hoc table creation would bypass Alembic history and risk making future migrations unreliable. The repository already has repair migration `20260917_0006`, so the correct repair path is migration execution.

Alternative considered: automatically run `flask db upgrade` from inside the app factory. That couples app creation to CLI migration behavior and can recurse or surprise tests; `start-api.sh` remains the migration runner.

### Keep checks table-level for this incident

The first readiness check should validate table presence only, not every column, index, or foreign key.

Rationale: the current production failure is a missing table, and a focused check keeps startup cost and implementation risk low. Deeper schema fingerprinting can be added later if drift continues after table-level readiness exists.

Alternative considered: full schema introspection against model metadata. That is more complex across MySQL and SQLite, easier to make noisy, and unnecessary for stopping the current `blog_tags` failure.

### Cover both helper behavior and app startup behavior in tests

Add tests that exercise the helper against a database missing `blog_tags`, and tests that prove production-like app creation fails when required tables are absent while testing-mode app creation remains usable.

Rationale: helper tests keep the missing-table contract precise, while app factory tests catch accidental removal from the startup path.

## Risks / Trade-offs

- The readiness check requires a database connection during production app creation -> Mitigation: `start-api.sh` already requires database connectivity for migrations before Gunicorn, so this matches the deployment contract.
- Railway may restart repeatedly if migrations remain unapplied -> Mitigation: fail-closed logs are preferable to serving broken API requests; docs should explain the recovery path.
- Table-level checks can miss column/index drift -> Mitigation: keep Alembic migrations and backend tests as the source for detailed schema correctness, and expand readiness later only if evidence supports it.
- A production-like local run without a database will fail earlier -> Mitigation: local development defaults remain non-production unless `MINIBLOG_ENV` or equivalent is set to a production-like value.

## Migration Plan

1. Add the schema readiness helper and production-scoped app factory integration.
2. Add backend tests for missing table detection, successful bypass in testing, and production-like startup failure.
3. Update `docs/database.md` and `apps/api/README.md` to describe the readiness gate and the expected failure message.
4. Run `python3 -B -m unittest discover -s tests` from `apps/api`.
5. Validate the OpenSpec change with `openspec validate add-runtime-schema-readiness-check --strict`.

Rollback is low-risk: revert the helper, app factory integration, tests, and docs. No schema or API rollback is involved.
