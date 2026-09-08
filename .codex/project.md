# MiniBlog Project Context

## Project Overview

MiniBlog is a full-stack blog application.

The project is separated into:

- Frontend: `apps/web`
- Backend: `apps/api`
- Shared documentation: `docs`
- Codex instructions and skills: `.codex`

## Main Features

- User registration
- User login/logout
- JWT authentication
- Refresh token flow
- Authenticated user profile summary
- Blog CRUD
- Author dashboard blog management
- Comment system
- Responsive UI

## Tech Stack

### Frontend

- Next.js 16 App Router
- TypeScript
- React 19
- Tailwind CSS 3
- ESLint

### Backend

- Python 3.12 runtime
- Flask 3
- Flask-SQLAlchemy
- Flask-Migrate
- PyJWT authentication
- MySQL through PyMySQL
- Gunicorn for the API container

## Current Runtime Shape

- Root Docker Compose defines `api` and `mysql` only.
- The backend runs on `http://127.0.0.1:8080` locally.
- The frontend runs on `http://localhost:3000` locally.
- The frontend calls the backend through `NEXT_PUBLIC_API_BASE_URL`.
- The frontend uses `NEXT_PUBLIC_SITE_URL` for generated metadata routes.
- Local MySQL is exposed on host port `3307` and container port `3306`.

## Folder Structure

```text
miniblog-project/
├── apps/
│   ├── web/
│   └── api/
├── docs/
├── .codex/
├── AGENTS.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## App Boundaries

Frontend handles:

- Pages
- Layouts
- Components
- UI state
- Form behavior
- Calling backend APIs
- Responsive UI

Backend handles:

- API routes
- Authentication
- Authorization
- Database models
- Database migrations
- Business logic
- Validation
- Error responses

## General Coding Rules

- Keep changes small.
- Follow existing structure.
- Reuse existing utilities/components.
- Do not introduce new libraries unless requested.
- Do not expose secrets.
- Do not change unrelated files.
- Keep API, auth, database, and runtime docs synchronized with behavior changes.
- Keep repo-specific skills synchronized after durable Markdown docs are updated.

---
