# MiniBlog Architecture

## Overview

MiniBlog is a two-app project:

- `apps/web`: Next.js 16 frontend using the App Router, TypeScript, React 19, and Tailwind CSS.
- `apps/api`: Flask backend using SQLAlchemy, Flask-Migrate, PyJWT, and MySQL through PyMySQL.

The frontend owns pages, UI state, form behavior, route navigation, and API client calls. The backend owns HTTP API routes, validation, authentication, authorization, persistence, and database migrations.

## Frontend

`apps/web` contains the user-facing application.

Frontend stack:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint

Implemented frontend routes:

- `/`: landing page with login and register entry points.
- `/login`: login form. Successful login stores the development access token in `localStorage` and redirects to `/dashboard`.
- `/register`: registration form. Registration does not automatically log the user in.
- `/dashboard`: authenticated user summary from `GET /auth/me` and an entry point for creating a blog.
- `/blogs`: public list of published blogs from `GET /blogs`.
- `/blogs/[slug]`: public blog detail from `GET /blogs/:slug`, comments from `GET /blogs/:slug/comments`, authenticated comment creation, comment author-only edit/delete controls, and blog author-only edit/delete controls.
- `/dashboard/blogs/new`: authenticated blog creation with draft or published status.
- `/dashboard/blogs/[slug]/edit`: authenticated author-only blog editing. It loads through `GET /blogs/:slug/mine` so authors can edit drafts as well as published posts.

Frontend API helpers live in:

- `apps/web/src/lib/api/auth.ts`
- `apps/web/src/lib/api/blogs.ts`
- `apps/web/src/lib/api/comments.ts`
- `apps/web/src/lib/api/client.ts`

Frontend route paths are centralized in:

- `apps/web/src/lib/routes.ts`

Frontend local configuration uses:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

## Backend

`apps/api` contains the Flask API.

Backend stack:

- Flask
- Flask-Cors
- Flask-SQLAlchemy
- Flask-Migrate
- PyJWT
- PyMySQL

Implemented backend route groups:

- `GET /health`
- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- Blogs: `GET /blogs`, `GET /blogs/<slug>`, `GET /blogs/<slug>/mine`, `POST /blogs`, `PATCH /blogs/<slug>`, `DELETE /blogs/<slug>`
- Comments: `GET /blogs/<slug>/comments`, `POST /blogs/<slug>/comments`, `PATCH /comments/<comment_id>`, `DELETE /comments/<comment_id>`

Public blog read routes only return published blogs. Authenticated blog write routes can act on draft or published blogs when the current user is the author. `GET /blogs/<slug>/mine` is the dashboard author-only read route for drafts and published posts.

Comment reads and creates are scoped to published blogs. Comment update and delete require a valid bearer access token and only allow the comment author.

## Database

MiniBlog uses SQLAlchemy models and Flask-Migrate migrations for:

- `users`
- `blogs`
- `comments`

Local development uses MySQL 8.4 from the root `docker-compose.yml`. The backend reads `DATABASE_URL`, then `SQLALCHEMY_DATABASE_URI`, and falls back to the local MySQL URI documented in `docs/database.md`.

## Communication

The frontend calls the backend REST API through `NEXT_PUBLIC_API_BASE_URL`.

Local development defaults:

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8080`

Run the backend locally with:

```bash
flask --app app run --debug --port 8080
```

The backend CORS configuration allows the local frontend origins configured by `CORS_ORIGINS`, including `http://localhost:3000` and `http://127.0.0.1:3000` by default.

Authentication uses bearer access tokens for protected API calls. The current frontend stores the access token in `localStorage` under `miniblog.dev.accessToken` for local development. Login also sets an HTTP-only refresh-token cookie for `/auth/refresh`.
