## Context

See `proposal.md` for motivation. The current repository configuration already sets `railway.json` deploy `startCommand` and both API Dockerfiles to `sh ./start-api.sh`, and `start-api.sh` runs `flask --app app db upgrade` before `exec gunicorn`. The new Railway log export still shows repeated Gunicorn worker boot attempts without any `Running database migrations before API start...` messages, followed by schema readiness failures for `tags` and `blog_tags`.

The active `add-runtime-schema-readiness-check` change adds a read-only production startup guard that prevents request-time crashes when required tables are missing. This change should treat that guard as the last line of defense, not the migration mechanism. The approved schema repair path remains Flask-Migrate.

## Goals / Non-Goals

**Goals:**

- Make the container image harder to start without `start-api.sh`.
- Keep all deployment paths using one migration runner and one Gunicorn command.
- Catch regressions with static tests that inspect the actual image/startup files.
- Give operators a log-based diagnosis for the exact state seen in Railway: Gunicorn logs with no migration logs.

**Non-Goals:**

- Do not create tables from request handlers or schema readiness checks.
- Do not run migrations from normal Flask app factory creation.
- Do not change tag/blog schema, migrations, API responses, or frontend behavior.
- Do not require Railway API credentials or committed deployment secrets.

## Decisions

### Move the migration wrapper from Docker CMD to Docker ENTRYPOINT

Update the root Railway `Dockerfile` and `apps/api/Dockerfile` so the image entrypoint invokes `sh ./start-api.sh`. Keep command/default behavior simple and avoid introducing a second startup script unless the implementation needs one to preserve local ergonomics.

Rationale: Railway or a platform UI can override the image command more easily than the image entrypoint. Making the migration wrapper the entrypoint closes the gap shown by the logs: direct Gunicorn command configuration no longer bypasses the repository-managed migration wrapper in normal Docker semantics.

Alternative considered: rely on `railway.json` and documentation only. The current failure already shows that configuration/docs alone did not keep the service on the migration path.

### Keep `start-api.sh` as the single source of runtime startup behavior

`start-api.sh` should continue to run migration retries and then start Gunicorn. If the script needs minor changes to handle arguments or clearer logs, keep them scoped and preserve the existing migration-before-Gunicorn ordering.

Rationale: duplicating migration logic in Dockerfiles, Procfile commands, or app factory code increases drift risk. The current startup script is already tested and documented.

Alternative considered: auto-run migrations inside `create_app()`. That would make every app creation capable of mutating production schema and would interfere with Flask-Migrate command startup.

### Test that Docker command override cannot skip the wrapper

Extend deployment startup tests to assert that both Dockerfiles use the migration wrapper as `ENTRYPOINT`, not only `CMD`, and that `railway.json` still points at the root Dockerfile. Add tests that would fail if a Dockerfile reverts to direct Gunicorn or a command-only startup path.

Rationale: the previous tests proved the desired command strings existed, but did not prove the image was hardened against command override.

Alternative considered: build and run the Docker image in tests. That is stronger but depends on Docker availability and live database configuration; static tests are enough for this regression.

### Improve log diagnosis documentation

Update docs to describe the three important log patterns:

1. migration attempt logs followed by `Database migrations are up to date.` and then Gunicorn,
2. migration retry/failure logs with no Gunicorn serving traffic,
3. Gunicorn startup logs with no migration logs, which indicates command/entrypoint drift or an outdated deployed image.

Rationale: the newest log file was only understandable because the absence of migration lines mattered as much as the schema error.

## Risks / Trade-offs

- Platform behavior may override entrypoint as well as command -> Mitigation: docs still tell operators to clear custom Start Command overrides and verify migration log lines after redeploy.
- ENTRYPOINT changes can affect local Compose behavior -> Mitigation: update both Dockerfiles consistently and run/update deployment startup tests; no Compose command override is currently configured.
- Static tests cannot prove Railway used the latest image -> Mitigation: docs require checking deploy logs for migration messages and redeploying the current image.
- Migrations may fail for real database reasons after the entrypoint fix -> Mitigation: keep `start-api.sh` fail-closed and let logs show migration retry/failure before Gunicorn.

## Migration Plan

1. Update root and API Dockerfiles so `start-api.sh` is the image entrypoint.
2. Adjust `start-api.sh` only if needed to preserve current local and Railway startup behavior.
3. Update deployment startup tests to assert entrypoint hardening and migration-before-Gunicorn ordering.
4. Update runtime docs with the new log diagnosis and Railway recovery checklist.
5. Run focused deployment startup tests, then full backend unit tests when practical.
6. If a MySQL database is available, run `flask --app app db upgrade`; otherwise document the skipped live database verification.
7. Run `openspec validate harden-railway-migration-entrypoint --strict`.

Rollback: restore the Dockerfiles to command-only startup and revert tests/docs. No database or API rollback is involved.
