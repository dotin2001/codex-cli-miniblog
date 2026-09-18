## 1. Runtime Readiness Implementation

- [x] 1.1 Add a backend schema readiness helper that inspects the active database tables and verifies `users`, `blogs`, `comments`, `tags`, and `blog_tags`; verify the helper reports missing required tables without mutating schema.
- [x] 1.2 Wire the readiness helper into `create_app()` after SQLAlchemy initialization and model imports for production-like runtime environments only; verify app startup raises a clear `RuntimeError` before route registration completes when `blog_tags` is missing.
- [x] 1.3 Preserve testing and non-production bypass behavior; verify existing SQLite-backed tests can create apps and call `db.create_all()` without requiring a pre-migrated database.

## 2. Backend Tests

- [x] 2.1 Add unit tests for the readiness helper with all required tables present and with `tags` or `blog_tags` missing; verify assertions cover the missing table names in the error.
- [x] 2.2 Add app factory tests for production-like startup failure when required tables are absent; verify the failure happens during app creation before requests are served.
- [x] 2.3 Add or update tests proving testing-mode app creation bypasses production readiness; verify the existing backend test suite remains compatible with isolated SQLite schemas.

## 3. Documentation

- [x] 3.1 Update `docs/database.md` with the runtime readiness gate behavior, the expected missing-table startup error, and the recovery path of running `flask --app app db upgrade`; verify no secrets or resolved Railway URLs are included.
- [x] 3.2 Update `apps/api/README.md` if needed so deployment/runtime guidance mentions that migrations run first and app startup then verifies required tables; verify the documented log sequence matches `apps/api/start-api.sh` plus the new readiness check.

## 4. Verification

- [x] 4.1 Run `python3 -B -m unittest discover -s tests` from `apps/api`; verify backend tests pass.
- [x] 4.2 If a MySQL database is available, run `flask --app app db upgrade` from `apps/api` against the documented local or target database; verify migrations complete, or document why live migration verification was skipped.
- [x] 4.3 Run `openspec validate add-runtime-schema-readiness-check --strict`; verify the proposal, spec, design, and tasks are valid.
