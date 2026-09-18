## 1. Entrypoint Hardening

- [x] 1.1 Confirm the runtime schema readiness guard from `add-runtime-schema-readiness-check` is present or applied before this change; verify production startup still fails closed when required tables are missing.
- [x] 1.2 Update the root `Dockerfile` so the Railway image invokes `sh ./start-api.sh` through Docker `ENTRYPOINT`; verify the file no longer relies only on `CMD` for the migration wrapper.
- [x] 1.3 Update `apps/api/Dockerfile` with the same migration-wrapper entrypoint behavior; verify local Compose image startup remains aligned with the Railway image.
- [x] 1.4 Review `apps/api/start-api.sh` after the Dockerfile changes and adjust only if needed for entrypoint compatibility; verify migration retry logs still appear before the `exec gunicorn` command.

## 2. Regression Tests

- [x] 2.1 Update `apps/api/tests/test_deployment_startup.py` so both Dockerfiles are asserted to use the migration wrapper as `ENTRYPOINT`; verify the test would fail for command-only startup.
- [x] 2.2 Keep or update the existing `railway.json` test to verify Railway still uses the repository root Dockerfile and does not configure direct Gunicorn; verify the test covers the root deploy config.
- [x] 2.3 Add or update startup-script assertions for the three important log states: migration attempt, migration success, and migration failure refusing API startup; verify the assertions match `apps/api/start-api.sh`.

## 3. Documentation

- [x] 3.1 Update `docs/database.md` with the Railway log diagnosis for Gunicorn startup without migration messages; verify it instructs operators to clear custom Start Command overrides, redeploy, and check for migration log lines.
- [x] 3.2 Update `apps/api/README.md` with the Docker entrypoint startup model and healthy startup log sequence; verify it explains that schema readiness errors after migration attempts mean the connected database still needs repair.
- [x] 3.3 Verify documentation does not include resolved Railway database URLs, passwords, tokens, or deployment secrets.

## 4. Verification

- [x] 4.1 Run the focused deployment startup tests from `apps/api`; verify they pass.
- [x] 4.2 Run `python3 -B -m unittest discover -s tests` from `apps/api`; verify backend tests pass.
- [x] 4.3 If Docker is available, build or inspect the API image startup configuration; verify the image entrypoint is the migration wrapper. If Docker is unavailable, document the skipped runtime image verification.
  - Verification note: `docker --version` is installed, but `docker build -t miniblog-api-entrypoint-check -f Dockerfile .` could not run because Docker Desktop's daemon is not reachable at `unix:///var/run/docker.sock`; runtime image inspection was skipped.
- [x] 4.4 If a MySQL database is available, run `flask --app app db upgrade` from `apps/api`; verify migrations complete. If MySQL is unavailable, document the skipped live migration verification.
  - Verification note: `flask --app app db upgrade` was attempted with local network access and failed with `ConnectionRefusedError: [Errno 61] Connection refused` for MySQL on `localhost`; live migration verification was skipped because no local MySQL service is listening.
- [x] 4.5 Run `openspec validate harden-railway-migration-entrypoint --strict`; verify the proposal, spec, design, and tasks are valid.
