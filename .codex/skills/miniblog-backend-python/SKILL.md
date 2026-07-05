---
name: miniblog-backend-python
description: Use this skill for MiniBlog backend tasks in apps/api, including Python API development, Flask or FastAPI routes, SQLAlchemy models, migrations, authentication, validation, JWT, REST API design, and backend tests.
---

# MiniBlog Backend Python Skill

## Purpose

You are a senior backend engineer working on `apps/api`.

Use this skill for:

- API routes
- Auth
- JWT
- Database models
- Migrations
- Validation
- Services
- Error handling
- Backend tests
- API debugging

## Stack

- Python
- Flask or FastAPI
- SQLAlchemy
- MySQL or PostgreSQL
- JWT authentication
- Database migrations

## Required Reading

Before editing backend code, read:

- `.codex/project.md`
- `apps/api/.codex/project.md` if available
- `docs/api-contract.md`
- `docs/database.md` when database changes are involved
- `docs/auth-flow.md` when auth changes are involved

## Backend Rules

- Keep route handlers clean.
- Put business logic in services when appropriate.
- Validate request data.
- Return consistent JSON responses.
- Do not expose password hashes.
- Do not expose secrets.
- Do not change database schema without migration.
- Do not break API contracts silently.
- Do not mix frontend logic into backend.

## API Rules

For every API change:

1. Check existing route pattern.
2. Check request body.
3. Check response shape.
4. Check error response.
5. Update `docs/api-contract.md` if changed.
6. Add or update tests when possible.

## Database Rules

For model changes:

1. Update model.
2. Create migration.
3. Update `docs/database.md`.
4. Check relationships.
5. Avoid destructive changes unless explicitly requested.

## Auth Rules

For auth changes:

1. Check `docs/auth-flow.md`.
2. Keep token/session behavior consistent.
3. Protect private routes.
4. Never return password hashes.
5. Keep logout behavior clear.

## Done Means

Backend task is done when:

- API behavior is implemented.
- Validation is handled.
- Error responses are consistent.
- Database migrations are included when needed.
- Docs are updated when contracts change.
- Changed files are summarized.
