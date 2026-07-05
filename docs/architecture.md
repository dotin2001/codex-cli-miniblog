# MiniBlog Architecture

## Overview

MiniBlog is currently scaffolded as a two-app project:

- `apps/web`: Next.js 16 frontend using the App Router, TypeScript, React 19, and Tailwind CSS.
- `apps/api`: Minimal Python Flask backend with a health check endpoint.

The current scaffold is intentionally small. It establishes the frontend and backend app boundaries without implementing the full product domains yet.

## Frontend

`apps/web` contains the user-facing application shell.

Current frontend stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint

Current frontend status:

- Uses the `src/app` App Router structure.
- Renders a static MiniBlog landing/application shell.
- Does not call backend APIs yet.
- Does not implement auth, profile, blog CRUD, or comments yet.

## Backend

`apps/api` contains the Python API scaffold.

Current backend stack:

- Flask
- Flask-SQLAlchemy extension wiring

Current backend status:

- Provides `GET /health`.
- Returns `{"status": "ok"}` for health checks.
- Does not connect to MySQL yet.
- Does not define database models or migrations yet.
- Does not implement auth, blog, or comment routes yet.

## Communication

The intended architecture is for `apps/web` to communicate with `apps/api` through REST APIs.

Current communication status:

- No frontend-to-backend API integration is wired yet.
- The only implemented backend endpoint is `GET /health`.

## Planned Domains

The following domains are planned but not implemented in the current scaffold:

- Auth
- Users
- Blogs
- Comments

Documentation files such as `docs/api-contract.md`, `docs/auth-flow.md`, and `docs/database.md` describe planned behavior and should be updated when those features are implemented.
