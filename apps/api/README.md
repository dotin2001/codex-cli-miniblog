# MiniBlog API

Flask API for the MiniBlog backend.

## Stack

- Flask
- Flask-Cors
- Flask-SQLAlchemy
- Flask-Migrate
- Gunicorn
- PyJWT
- PyMySQL

## Setup

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

For local MySQL, copy the root example environment file and start MySQL:

```bash
cd ../..
cp .env.example .env
docker compose up -d mysql
cd apps/api
```

When running Flask on the host machine, use the Compose host port:

```text
mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3307/miniblog
```

When running an app container on the Docker Compose network, use the MySQL service name and container port:

```text
mysql+pymysql://miniblog:miniblog_password@mysql:3306/miniblog
```

The Flask app reads `DATABASE_URL` first, then `SQLALCHEMY_DATABASE_URI`, and finally falls back to its built-in local database URL. Copy `.env.example` to `.env` for the documented host-machine setup.

The Docker Compose API service overrides `DATABASE_URL` to use `mysql:3306`, so the container connects over the Compose network even when `.env` contains the host-machine URL.

Auth, blog, current-user, and comment endpoints allow credentialed CORS requests from the local Next.js frontend origins configured by `CORS_ORIGINS`:

```text
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Database

Apply migrations after MySQL is running:

```bash
cd apps/api
set -a
source ../../.env
set +a
flask --app app db upgrade
```

Migration files live in `apps/api/migrations`.

When running the API container, apply migrations explicitly from the project root after MySQL is running:

```bash
docker compose run --rm api flask --app app db upgrade
```

## Run

```bash
flask --app app run --debug --port 8080
```

The API will be available at:

```text
http://127.0.0.1:8080
```

## Docker

Build and run the API service from the project root:

```bash
docker compose build api
docker compose up api
```

The container image uses Gunicorn on `0.0.0.0:8080`. It does not run migrations automatically.

## Health Check

```bash
curl http://127.0.0.1:8080/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Implemented Endpoints

Health:

- `GET /health`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Current user:

- `GET /me/blogs`

Blogs:

- `GET /blogs`
- `GET /blogs/<slug>`
- `GET /blogs/<slug>/mine`
- `POST /blogs`
- `PATCH /blogs/<slug>`
- `DELETE /blogs/<slug>`

Comments:

- `GET /blogs/<slug>/comments`
- `POST /blogs/<slug>/comments`
- `PATCH /comments/<comment_id>`
- `DELETE /comments/<comment_id>`

Public blog read endpoints return published blogs only. `GET /me/blogs` returns the current authenticated user's draft and published blogs. Authenticated blog write endpoints and `GET /blogs/<slug>/mine` enforce author-only access where required.

## Verify

```bash
python3 -B -m unittest discover -s tests
```

The backend test suite uses Flask's test client with an in-memory SQLite database.
