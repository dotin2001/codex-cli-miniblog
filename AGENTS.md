# MiniBlog Agent Instructions

This repository contains the MiniBlog full-stack project.

Before working on this repository, read the relevant project context:

- `.codex/project.md` for overall project context
- `docs/architecture.md` for system structure and app boundaries
- `docs/api-contract.md` when changing frontend-backend communication
- `docs/database.md` when changing models, migrations, or schema
- `docs/auth-flow.md` when changing authentication, JWT, refresh token, cookies, or protected routes

## Skill Routing

Use the correct skill depending on the task type:

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
