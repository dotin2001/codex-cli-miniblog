---
name: miniblog-project-orchestrator
description: Use this skill when a MiniBlog task affects both frontend and backend, including authentication flow, blog CRUD, comments, user profile, API contract changes, database-related UI changes, or cross-app debugging.
---

# MiniBlog Project Orchestrator

## Purpose

You are working on the MiniBlog full-stack project.

Use this skill when the task affects both:

- `apps/web`
- `apps/api`

Examples:

- Login flow
- Register flow
- Refresh token flow
- Blog CRUD from UI to API
- Comment creation from UI to API
- Profile page connected to backend
- API response changes used by frontend
- Full-stack bug fixing

## Required Reading

Before editing code, read:

- `.codex/project.md`
- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/auth-flow.md` if auth is involved
- `docs/database.md` if models or migrations are involved

## Workflow

1. Identify whether the task affects frontend, backend, or both.
2. Check the current API contract.
3. Check current frontend usage.
4. Make the smallest safe backend change.
5. Make the matching frontend change.
6. Update docs if API, auth, or database behavior changes.
7. Run or recommend relevant checks.
8. Summarize changed files and risks.

## Rules

- Do not change API contracts silently.
- Do not change database schema without migration.
- Do not redesign UI unless explicitly requested.
- Do not rewrite unrelated files.
- Do not introduce new dependencies unless necessary.
- Keep frontend and backend responsibilities separated.

## Done Means

A task is done only when:

- Backend behavior is implemented or verified.
- Frontend usage matches backend contract.
- Related docs are updated if needed.
- Auth/database impact is checked.
- Changed files are summarized.
