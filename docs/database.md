# Database

MiniBlog is configured for local MySQL development through Docker Compose. The backend uses SQLAlchemy, Flask-Migrate, and the PyMySQL driver.

The first application table is `users`. Blog and comment tables will be added in later feature work with explicit migrations.

## Tables

### users

Stores user account records for future authentication flows. Authentication endpoints, JWT behavior, and password hashing are not implemented yet.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | integer | primary key | Internal user identifier. |
| `name` | string(120) | not null | User display name. |
| `email` | string(255) | not null, unique, indexed | Used for account lookup and future login. |
| `password_hash` | string(255) | not null | Reserved for a hashed password value. Never expose this field in API responses. |
| `created_at` | datetime | not null, default current timestamp | Record creation timestamp. |
| `updated_at` | datetime | not null, default current timestamp | Record update timestamp. |

## Local MySQL

The root `docker-compose.yml` defines one MySQL 8.4 service:

- Service: `mysql`
- Container: `miniblog-mysql`
- Database: `miniblog`
- User: `miniblog`
- Host port: `3306`
- Data volume: `mysql_data`

Use `.env.example` as the template for local settings:

```bash
cp .env.example .env
```

Start MySQL from the project root:

```bash
docker compose up -d mysql
```

The local Flask database URI is:

```text
mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3306/miniblog
```

The backend reads `DATABASE_URL` first, then `SQLALCHEMY_DATABASE_URI`, and falls back to that local URI when neither variable is set.

## Backend Setup

Install backend dependencies:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the API:

```bash
flask --app app run --debug
```

Verify the existing health endpoint:

```bash
curl http://127.0.0.1:5000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Migrations

Flask-Migrate is wired into the Flask application. Migration files live in `apps/api/migrations`.

Create and apply migrations from `apps/api`:

```bash
flask --app app db migrate -m "describe schema change"
flask --app app db upgrade
```

Apply existing migrations to local MySQL:

```bash
cd apps/api
set -a
source ../../.env
set +a
flask --app app db upgrade
```

Commit generated migration files with the model changes that require them.
