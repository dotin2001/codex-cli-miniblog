# MiniBlog Agent Instructions

This repository contains the MiniBlog full-stack project.

Before working on this repository, read the relevant project context:

- `.codex/project.md` for overall project context
- `docs/architecture.md` for system structure and app boundaries
- `docs/api-contract.md` when changing frontend-backend communication
- `docs/database.md` when changing models, migrations, or schema
- `docs/auth-flow.md` when changing authentication, JWT, refresh token, cookies, or protected routes
- `apps/api/AGENTS.md` when working inside the backend app
- `apps/web/AGENTS.md` when working inside the frontend app

## Skill Routing

This repository intentionally keeps its repo-specific Codex skills in `.codex/skills`. Use the correct skill depending on the task type:

- `.codex/skills/miniblog-project-orchestrator/SKILL.md`
  - Use for full-stack tasks
  - Use when a change affects both frontend and backend
  - Use when planning feature flow across app layers

- `.codex/skills/miniblog-frontend-nextjs/SKILL.md`
  - Use for frontend tasks
  - Use for Next.js, TypeScript, TailwindCSS, UI, routing, components, forms, modals, responsive layout, and frontend API integration

- `.codex/skills/miniblog-backend-python/SKILL.md`
  - Use for backend tasks
  - Use for Flask, Python, MySQL, SQLAlchemy, migrations, API routes, validation, auth, JWT, and backend tests

Repo-specific docs and skills are the primary source of truth. Use external best-practice skills only as secondary guidance:

- Vercel React/Next.js best practices are suitable for frontend performance, bundle, data-fetching, and App Router reviews in `apps/web`.
- Do not add frontend libraries such as SWR, component libraries, or form libraries just because external guidance mentions them.
- Generic Python Flask MySQL backend guidance is suitable for backend architecture, SQLAlchemy, auth, migration, and production-hardening review, but project-specific MiniBlog rules override generic assumptions.
- Microsoft or Azure Flask guidance is suitable only for Azure deployment or Microsoft service integration. For normal backend work, prefer the MiniBlog backend skill and official Flask, SQLAlchemy, Flask-Migrate, PyJWT, and MySQL/PyMySQL docs.
- When improving agent instructions, update durable Markdown context first, then align `.codex/skills/*/SKILL.md`.

## Working Rules

- Make the smallest safe change.
- Do not rewrite unrelated files.
- Do not redesign UI unless explicitly requested.
- Check `git status` before editing. Do not revert, overwrite, or reformat unrelated user changes.
- Do not add new npm or Python dependencies unless the existing stack cannot reasonably solve the task. If adding one, explain why and update the relevant lockfile.
- Do not change API contracts without updating `docs/api-contract.md`. This includes endpoint paths, methods, request bodies, response bodies, status codes, auth requirements, cookies, headers, pagination, and error shapes.
- Do not change database schema without updating `docs/database.md` and adding a migration. This includes tables, columns, indexes, constraints, relationships, defaults, nullable behavior, and persistence rules.
- Never commit secrets, `.env`, API keys, tokens, or credentials.
- Keep frontend and backend responsibilities separated.
- Follow the existing folder structure.
- Prefer reusable components and clean service/helper layers.
- For UI changes, preserve responsive behavior, dark mode, accessibility basics, and the existing visual style unless redesign is requested.
- When adding or changing behavior, add or update the smallest relevant test where the project already has test coverage for that layer.
- Do not edit generated framework files such as `apps/web/next-env.d.ts` unless a generated-file issue is the explicit task.
- If instructions conflict, prefer the more specific document for the touched area. If docs appear stale, mention the mismatch before changing behavior.
- Explain changed files after each task.
- Mention anything not tested.

## Verification Rules

After making changes:

- Run the smallest relevant test or verification command.
- For frontend changes, verify TypeScript, lint, build, or the affected page/component when possible.
  - From `apps/web`, use `npm run lint`, `npm run typecheck`, or `npm run build` as appropriate.
- For backend changes, verify tests, migration status, API route behavior, or application startup when possible.
  - From `apps/api`, use `python3 -B -m unittest discover -s tests`.
  - For migration changes, also verify with `flask --app app db upgrade` when a database is available.
- If verification cannot be run, clearly explain why.
