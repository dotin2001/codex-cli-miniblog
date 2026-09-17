## 1. Deployment Startup Regression Coverage

- [x] 1.1 Add a backend test that verifies `railway.json` uses `sh ./start-api.sh` as the deploy start command and verify the new test fails if the command is changed to direct Gunicorn.
- [x] 1.2 Add backend tests that verify the root `Dockerfile`, `apps/api/Dockerfile`, and `apps/api/Procfile` invoke `start-api.sh`; verify the tests cover all three files.
- [x] 1.3 Add a backend test that verifies `apps/api/start-api.sh` runs `flask --app app db upgrade` before `gunicorn`; verify the assertion depends on command ordering, not only text presence.

## 2. Operational Documentation

- [x] 2.1 Update `docs/database.md` with a Railway missing `blog_tags` diagnosis section; verify it explains that `GET /blogs` fails because the deployed database schema is behind the code.
- [x] 2.2 Document the recovery checklist for Railway: confirm the service uses `sh ./start-api.sh`, redeploy the current image, and apply pending migrations against the connected MySQL database; verify no secrets or resolved Railway database URLs are included.
- [x] 2.3 Document the expected healthy startup log sequence, including migration attempts and `Database migrations are up to date.` before Gunicorn; verify the guidance matches `apps/api/start-api.sh`.

## 3. Verification

- [x] 3.1 Run `python3 -B -m unittest discover -s tests` from `apps/api`; verify the new startup regression tests and existing backend tests pass.
- [x] 3.2 If a MySQL database is available, run `flask --app app db upgrade` from `apps/api` against the target environment or local MySQL; verify pending migrations complete or document why live database verification was skipped.
- [x] 3.3 Run `openspec validate prevent-railway-blog-tag-schema-drift --strict`; verify the proposal, spec, design, and tasks are valid.
