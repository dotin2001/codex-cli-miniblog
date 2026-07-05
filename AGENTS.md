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
- Do not change API contracts without updating `docs/api-contract.md`.
- Do not change database schema without updating `docs/database.md` and adding a migration.
- Never commit secrets, `.env`, API keys, tokens, or credentials.
- Keep frontend and backend responsibilities separated.
- Follow the existing folder structure.
- Prefer reusable components and clean service/helper layers.
- Explain changed files after each task.
- Mention anything not tested.

## Verification Rules

After making changes:

- Run the smallest relevant test or verification command.
- For frontend changes, verify TypeScript, lint, build, or the affected page/component when possible.
- For backend changes, verify tests, migration status, API route behavior, or application startup when possible.
- If verification cannot be run, clearly explain why.
