# MiniBlog

MiniBlog is a full-stack blog application with a Next.js frontend and a Flask backend.

The current app implements local authentication, published blog browsing, authenticated blog CRUD, comments, author-only edit/delete rules, and a dashboard editing flow for draft and published posts.

## Project Structure

```text
codex-cli-miniblog/
├── apps/
│   ├── web/      # Next.js frontend
│   └── api/      # Flask backend
├── docs/         # Architecture, API, auth, and database documentation
├── .codex/       # Project context and agent skills
└── README.md
```

## Stack

Frontend:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- ESLint

Backend:

- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- PyJWT
- PyMySQL

Database:

- Local MySQL 8.0 via Docker Compose

## Local URLs

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://127.0.0.1:8080
```

## Environment

Backend local settings are based on the root example:

```bash
cp .env.example .env
```

For local development, replace the placeholder values in `.env`, keep `MINIBLOG_ENV=development`, and set `JWT_SECRET_KEY` to a long random local-only value. Production-like environments such as the Compose API service use `MINIBLOG_ENV=production` and fail fast when `JWT_SECRET_KEY` is empty, too short, or still set to a placeholder.

Frontend local settings are based on:

```bash
cp apps/web/.env.example apps/web/.env.local
```

The frontend API base URL should match the local Flask run command:

```text
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

## Backend Setup

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start MySQL from the project root:

```bash
docker compose up -d mysql
```

For host-machine development, keep `DATABASE_URL` pointed at the Compose host port:

```text
mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3307/miniblog
```

For Docker-network/container usage, use the Compose service name and MySQL container port:

```text
mysql+pymysql://miniblog:miniblog_password@mysql:3306/miniblog
```

The Compose API service sets that container `DATABASE_URL` explicitly, so a host-oriented `.env` value does not make the API container try to reach MySQL through `127.0.0.1:3307`.

For Railway deployments, set `DATABASE_URL=${{mysql.MYSQL_URL}}` in the Railway Variables UI only. Do not copy that expression or resolved Railway secrets into local `.env` files. Railway may resolve the value to a `mysql://` URL; the backend automatically normalizes that scheme to `mysql+pymysql://` for SQLAlchemy and leaves existing `mysql+pymysql://` URLs unchanged.

For HTTPS deployments, set `REFRESH_TOKEN_COOKIE_SECURE=true` and set `CORS_ORIGINS` to the allowed frontend origins as a comma-separated list.

Apply migrations:

```bash
cd apps/api
set -a
source ../../.env
set +a
flask --app app db upgrade
```

For the API container, run migrations separately after MySQL is running:

```bash
docker compose run --rm api flask --app app db upgrade
```

Run the API:

```bash
flask --app app run --debug --port 8080
```

Build and run the API container from the project root:

```bash
docker compose build api
docker compose up api
```

The API container runs the Flask app with Gunicorn. It does not run migrations automatically.

Health check:

```bash
curl http://127.0.0.1:8080/health
```

## Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

The repository includes `.nvmrc` files at the root and in `apps/web` for the Node version used by this project.

## Implemented Features

- User registration, login, logout, refresh-token cookie issuance, and `GET /auth/me`
- Public blog list and public blog detail for published posts only
- Authenticated dashboard list for the current user's draft and published posts
- Authenticated blog create, update, delete, and author-only draft/published fetch for dashboard editing
- Comment list/create/update/delete, with author-only edit/delete behavior
- Frontend routes for home, login, register, dashboard, my blogs, blog list, blog detail, create blog, and edit blog
- Centralized frontend route helper in `apps/web/src/lib/routes.ts`

## Verification

Backend:

```bash
cd apps/api
python3 -B -m unittest discover -s tests
```

Frontend:

```bash
cd apps/web
npm run lint
npm run test
npm run typecheck
```

## Documentation

See:

- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/auth-flow.md`
- `docs/database.md`
