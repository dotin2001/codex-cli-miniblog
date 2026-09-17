---
name: miniblog-backend-python
description: Use this skill for MiniBlog backend tasks in apps/api or backend AI-instruction updates, including Flask routes and Blueprints, SQLAlchemy models, Flask-Migrate migrations, MySQL/PyMySQL runtime configuration, PyJWT authentication, refresh-token cookies, validation, REST API contracts, backend unittest coverage, and backend-specific AGENTS.md guidance.
---

# MiniBlog Backend Python Skill

## Purpose

Work as a senior backend engineer in `apps/api`. Keep the backend aligned with the documented MiniBlog API, auth flow, database schema, and Docker runtime.

Use this skill for API routes, authentication, authorization, validation, SQLAlchemy models, migrations, service/helper extraction, error handling, backend tests, and backend debugging.

## Stack

- Python in the API container: `python:3.12-slim`
- Flask `3.1.2`
- Flask-Cors `6.0.2`
- Flask-SQLAlchemy `3.1.1`
- Flask-Migrate `4.1.0`
- PyJWT `2.10.1`
- PyMySQL `1.1.2`
- cryptography `43.0.3`
- MySQL 8.0 for local/runtime persistence
- Gunicorn `23.0.0` for the API container

Do not introduce FastAPI, PostgreSQL, Flask-JWT-Extended, or python-dotenv assumptions unless the user explicitly asks for that migration and the dependency files are updated.

## Required Reading

Before editing backend code, read:

- `.codex/project.md`
- `AGENTS.md`
- `apps/api/AGENTS.md`
- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/database.md` when database changes are involved
- `docs/auth-flow.md` when auth changes are involved
- Nearby route, model, migration, and test files for the behavior being changed

When framework behavior is version-sensitive or unclear, consult official docs before editing:

- Flask app factories and Blueprints: `https://flask.palletsprojects.com/en/stable/`
- Flask-SQLAlchemy: `https://flask-sqlalchemy.palletsprojects.com/en/stable/`
- Flask-Migrate: `https://flask-migrate.readthedocs.io/en/latest/`
- Flask-Cors: `https://flask-cors.readthedocs.io/en/latest/api.html`
- SQLAlchemy MySQL/PyMySQL dialect: `https://docs.sqlalchemy.org/`
- PyJWT: `https://pyjwt.readthedocs.io/`
- Docker MySQL image: `https://hub.docker.com/_/mysql/`

Use Microsoft or Azure Flask guidance only when the task explicitly involves Azure deployment, Microsoft identity, Azure MySQL, Key Vault, App Service, or another Microsoft service. For ordinary backend changes, use the MiniBlog docs plus official Flask ecosystem documentation.

Use generic `python-flask-mysql-backend` guidance only as secondary review input for architecture, SQLAlchemy, auth, migrations, and production hardening. MiniBlog-specific rules override it:

- Use PyJWT directly; do not introduce Flask-JWT-Extended unless the user asks for that migration.
- Do not assume python-dotenv; configuration comes from environment variables and `app/config.py`.
- Do not force `services/`, `schemas/`, `middleware/`, or `utils/` directories unless they remove real duplication or match an active refactor.
- Preserve the current error envelope instead of switching to generic `{ success, data, errors }` shapes.

## Backend Rules

- Preserve the Flask app factory in `app/__init__.py` and extension initialization through `app/extensions.py`.
- Register API surfaces through existing Blueprint patterns in `app/routes`.
- Keep route handlers clean.
- Put durable business logic in helpers or services only when it reduces real route duplication.
- Validate request data.
- Return the documented JSON envelope and status code.
- Do not expose password hashes.
- Do not expose secrets.
- Do not change database schema without migration.
- Do not break API contracts silently.
- Do not mix frontend logic into backend.
- Keep tests using in-memory SQLite unless the test specifically verifies MySQL/runtime configuration.
- Keep runtime database behavior MySQL-compatible.
- Keep database writes explicit. Roll back on handled write failures that can leave the session unusable.

## API Rules

For every API change:

1. Check existing route pattern.
2. Check request body.
3. Check response shape.
4. Check error response.
5. Update `docs/api-contract.md` if changed.
6. Add or update tests when possible.

Current route groups:

- `GET /health`
- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- Me: `GET /me/blogs`
- Blogs: public reads, author-only draft reads through `/blogs/<slug>/mine`, author-only create/update/delete
- Comments: published-blog comment reads and create, comment author-only update/delete

Use existing error shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message.",
    "fields": {}
  }
}
```

Omit `fields` unless returning validation details.

## Database Rules

For model changes:

1. Update model.
2. Create migration.
3. Update `docs/database.md`.
4. Check relationships.
5. Avoid destructive changes unless explicitly requested.

Database facts to preserve:

- Runtime/local database is MySQL 8.0 through Docker Compose.
- Host tools connect to `127.0.0.1:3307`; containers connect to `mysql:3306`.
- `DATABASE_URL` is read before `SQLALCHEMY_DATABASE_URI`.
- `mysql://` is normalized to `mysql+pymysql://`; existing `mysql+pymysql://` passes through unchanged.
- Tests typically use `sqlite:///:memory:` with `db.create_all()` and `db.drop_all()`.
- Existing tables are `users`, `blogs`, and `comments`.
- Blog statuses are exactly `draft` and `published`.

Indexing guidance:

- Current indexes are `users.email` and `blogs.slug`.
- Consider `blogs(status, created_at, id)` when public blog list traffic grows.
- Consider `blogs(author_id, created_at, id)` when dashboard blog list traffic grows.
- Consider `comments(blog_id, created_at, id)` when comment list traffic grows.
- Add indexes only with a migration and `docs/database.md` update.

## Auth Rules

For auth changes:

1. Check `docs/auth-flow.md`.
2. Keep token/session behavior consistent.
3. Protect private routes.
4. Never return password hashes.
5. Keep logout behavior clear.

Current auth behavior to preserve unless the task explicitly changes it:

- Registration stores a Werkzeug password hash and does not log in, return tokens, set cookies, or create refresh-token state.
- Login returns an HS256 PyJWT access token and public user object.
- Login sets a refresh-token JWT in an HTTP-only cookie.
- Access token uses `sub`, `user`, `iat`, and `exp`.
- Refresh token uses `sub`, `typ: "refresh"`, `iat`, and `exp`.
- Protected routes require `Authorization: Bearer <accessToken>`.
- Refresh uses the configured refresh cookie and returns a new access token.
- Logout clears the refresh cookie but does not revoke existing access tokens.
- There is no database-backed refresh-token table.
- Production-like envs must reject empty, short, or placeholder `JWT_SECRET_KEY` values.

Future production hardening that fits this project:

- Add database-backed refresh-token sessions when logout revocation, device sessions, or token rotation become required.
- Store only hashed refresh-token identifiers or JTIs if refresh-token persistence is added.
- Keep access tokens short-lived and refresh tokens scoped to the configured HTTP-only cookie path.
- Verify cookie flags and CORS together for browser auth changes.

Cookie defaults:

- Name: `refreshToken`
- `HttpOnly`
- `SameSite=Lax`
- `Path=/auth`
- `Secure=false` for local HTTP

## Docker Rules

- Root Compose defines `api` and `mysql`; it does not define the frontend service.
- API container runs Gunicorn on port `8080`.
- MySQL service uses the official `mysql:8.0` image and environment variables from `.env`.
- Do not commit `.env`, secrets, resolved Railway variables, or local credentials.

## Verification

Run the smallest relevant backend check:

```bash
cd apps/api
python3 -B -m unittest discover -s tests
```

For migration changes, also verify when a database is available:

```bash
cd apps/api
flask --app app db upgrade
```

For Docker/runtime changes, verify the affected Compose command when Docker is available.

## Done Means

Backend task is done when:

- API behavior is implemented.
- Validation is handled.
- Error responses are consistent.
- Database migrations are included when needed.
- Docs are updated when contracts change.
- Targeted backend tests or runtime checks are run, or the reason they were not run is stated.
- Changed files are summarized.
