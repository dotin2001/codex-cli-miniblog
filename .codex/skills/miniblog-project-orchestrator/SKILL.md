---
name: miniblog-project-orchestrator
description: Use this skill when a MiniBlog task affects both frontend and backend, shared project docs, or repo AI instructions/skills, including API contract changes, authentication and refresh-token flow, blog CRUD, comments, user profile, database-backed UI changes, Docker/runtime coordination, cross-app debugging, or aligning AGENTS.md and .codex/skills guidance.
---

# MiniBlog Project Orchestrator

## Purpose

Coordinate full-stack MiniBlog work across `apps/web`, `apps/api`, shared docs, and Docker runtime configuration.

Use this skill when the task affects both frontend and backend, or when a backend/API/database/auth change must be reflected in frontend helpers, UI, tests, and docs.

## Required Reading

Before editing code, read:

- `.codex/project.md`
- `AGENTS.md`
- `docs/architecture.md`
- `docs/api-contract.md` for frontend-backend communication
- `docs/auth-flow.md` if auth is involved
- `docs/database.md` if models or migrations are involved
- `apps/api/AGENTS.md` if backend files are involved
- `apps/web/AGENTS.md` if frontend files are involved
- The relevant frontend API helper/component files
- The relevant backend route/model/test/migration files

When framework behavior is version-sensitive or unclear, consult official docs before editing:

- Next.js App Router and TypeScript: `https://nextjs.org/docs/app`
- React reference: `https://react.dev/reference/react`
- Flask app factories and Blueprints: `https://flask.palletsprojects.com/en/stable/`
- Flask-SQLAlchemy and Flask-Migrate docs
- PyJWT docs for token behavior
- Docker MySQL image docs for Compose database behavior

Use external best-practice skills only as secondary guidance:

- Load `build-web-apps:react-best-practices` with `miniblog-frontend-nextjs` when frontend work touches React components, App Router pages, server/client data fetching, bundle size, rerender behavior, or performance-sensitive UI.
- Do not add frontend libraries such as SWR, UI kits, or form libraries just because external guidance mentions them.
- Use Microsoft or Azure Flask guidance only for Azure deployment, Microsoft identity, or Microsoft service integration.
- For ordinary backend work, prefer official Flask, SQLAlchemy, Flask-Migrate, PyJWT, and MySQL/PyMySQL docs.

## Actual Project Stack

Frontend:

- `apps/web`
- Next.js `16.2.10`, React `19.2.7`, TypeScript `6.0.3`, Tailwind CSS `3.4.17`
- API helpers in `src/lib/api`
- Auth-session helper in `src/lib/auth-session.ts`
- Route helpers in `src/lib/routes.ts`

Backend:

- `apps/api`
- Flask `3.1.2`, Flask-Cors, Flask-SQLAlchemy, Flask-Migrate, PyJWT, PyMySQL
- App factory in `app/__init__.py`
- Routes in `app/routes`
- Models in `app/models`
- Migrations in `migrations`

Runtime:

- Root `docker-compose.yml` defines `api` and `mysql`.
- MySQL is `mysql:8.0`.
- API container runs Gunicorn on port `8080`.
- There is no frontend Docker service.

## Workflow

1. Identify whether the task affects frontend, backend, or both.
2. Check the current API contract, auth flow, and database docs before choosing the implementation path.
3. Trace current backend behavior through routes, models, migrations, and tests.
4. Trace current frontend behavior through API helpers, auth-session helper, routes, pages, and components.
5. Make the smallest safe change in the owning layer first.
6. Make matching cross-layer changes only where the contract requires them.
7. Update docs if API, auth, database, Docker, or runtime behavior changes.
8. Run the smallest relevant checks for each touched layer.
9. Summarize changed files, verification, and remaining risk.

For AI instruction or skill maintenance:

1. Review the codebase facts that the instructions describe.
2. Update durable Markdown context first, such as `AGENTS.md`, `.codex/project.md`, app `AGENTS.md`, and `docs/*`.
3. Update `.codex/skills/*/SKILL.md` after the docs express the intended source of truth.
4. Keep skills concise and procedural; do not duplicate large docs inside skills.
5. Validate skill frontmatter and naming after edits.

## Rules

- Do not change API contracts silently.
- Do not change database schema without migration.
- Do not redesign UI unless explicitly requested.
- Do not rewrite unrelated files.
- Do not introduce new dependencies unless necessary.
- Keep frontend and backend responsibilities separated.
- Do not create frontend-only representations of backend business rules unless they are form validation hints backed by server validation.
- Do not widen CORS, weaken JWT handling, or relax cookie/security settings without explicit reason.
- Do not invent Docker services that are not in Compose.
- Do not edit generated framework files such as `apps/web/next-env.d.ts` unless that generated file is the explicit task.

## Cross-Layer Contracts

Preserve these current contracts unless the user asks to change them:

- Frontend base API URL: `NEXT_PUBLIC_API_BASE_URL`, default `http://127.0.0.1:8080`.
- Backend local URL: `http://127.0.0.1:8080`.
- Local frontend URL: `http://localhost:3000`.
- Public blog reads return published blogs only.
- Draft and published author reads use authenticated endpoints such as `/me/blogs` and `/blogs/<slug>/mine`.
- Protected writes use bearer access tokens.
- Refresh uses an HTTP-only refresh-token cookie and returns a new access token.
- Frontend protected actions use `runWithFreshAccessToken()` and retry once after `401`.
- API errors use `{ "error": { "code", "message", "fields?" } }`.
- Blog/comment author-only mutations return documented `403` shapes.

## Skill Routing

Use the focused skill when a subtask is contained:

- Use `miniblog-backend-python` for backend-only Flask, model, migration, auth, validation, or unittest work.
- Use `miniblog-frontend-nextjs` for frontend-only Next.js, React, Tailwind, route helper, API helper, or frontend test work.
- Add `build-web-apps:react-best-practices` for frontend performance or refactor work, then apply only the Vercel rules that fit MiniBlog's plain Next.js/React dependency set.
- Stay in this orchestrator skill for contract changes, auth flow changes across layers, feature flow planning, Docker/runtime coordination, or cross-app debugging.

## Verification Matrix

Backend:

```bash
cd apps/api
python3 -B -m unittest discover -s tests
```

Frontend:

```bash
cd apps/web
npm run test
npm run lint
npm run typecheck
npm run build
```

Migrations when a database is available:

```bash
cd apps/api
flask --app app db upgrade
```

Docker/runtime changes when Docker is available:

```bash
docker compose config
docker compose up -d mysql
docker compose run --rm api flask --app app db upgrade
```

Run only the checks relevant to the files changed, and state anything not tested.

## Done Means

A task is done only when:

- Backend behavior is implemented or verified.
- Frontend usage matches backend contract.
- Related docs are updated if needed.
- Auth/database impact is checked.
- Relevant tests or checks are run, or skipped checks are explained.
- Changed files are summarized.
