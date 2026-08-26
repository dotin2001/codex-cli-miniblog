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
- User profile
- Blog CRUD
- Comment system
- Responsive UI

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- React
- Tailwind CSS

### Backend

- Python
- Flask
- SQLAlchemy
- MySQL
- JWT authentication
- Database migrations

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

---
