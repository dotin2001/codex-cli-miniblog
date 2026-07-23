# Database

MiniBlog is configured for local MySQL development through Docker Compose. The backend uses SQLAlchemy, Flask-Migrate, and the PyMySQL driver.

The first application tables are `users`, `blogs`, and `comments`.

## Tables

### users

Stores user account records for authentication flows. Registration stores secure password hashes. Login verifies those hashes and issues JWT access tokens plus an HTTP-only refresh-token cookie.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | integer | primary key | Internal user identifier. |
| `name` | string(120) | not null | User display name. |
| `email` | string(255) | not null, unique, indexed | Used for account lookup and future login. |
| `password_hash` | string(255) | not null | Reserved for a hashed password value. Never expose this field in API responses. |
| `created_at` | datetime | not null, default current timestamp | Record creation timestamp. |
| `updated_at` | datetime | not null, default current timestamp | Record update timestamp. |

Relationship:

- One user can author many blog records through `blogs.author_id`.
- One user can author many comment records through `comments.author_id`.

### blogs

Stores blog post records for blog CRUD. Comment create, list, update, and delete routes are implemented. Likes, categories, and tags are not implemented yet.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | integer | primary key | Internal blog identifier. |
| `title` | string(255) | not null | Blog post title. |
| `slug` | string(255) | not null, unique, indexed | URL-friendly unique blog identifier. |
| `excerpt` | string(500) | nullable | Short summary text for previews. |
| `content` | text | not null | Main blog post body. |
| `status` | string(20) | not null, default `draft`, check `draft` or `published` | Publication state used by public reads and dashboard editing. |
| `author_id` | integer | not null, foreign key to `users.id` | User who authored the blog post. |
| `created_at` | datetime | not null, default current timestamp | Record creation timestamp. |
| `updated_at` | datetime | not null, default current timestamp | Record update timestamp. |

Relationship:

- Each blog belongs to one user through `blogs.author_id`.
- One user can author many blogs.
- One blog can have many comments through `comments.blog_id`.

### comments

Stores comment records for blog posts. Comment create, list, update, and delete routes are implemented.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | integer | primary key | Internal comment identifier. |
| `content` | text | not null | Comment body text. |
| `author_id` | integer | not null, foreign key to `users.id` | User who authored the comment. |
| `blog_id` | integer | not null, foreign key to `blogs.id` | Blog post that owns the comment. |
| `created_at` | datetime | not null, default current timestamp | Record creation timestamp. |
| `updated_at` | datetime | not null, default current timestamp | Record update timestamp. |

Relationship:

- Each comment belongs to one user through `comments.author_id`.
- Each comment belongs to one blog through `comments.blog_id`.
- One user can author many comments.
- One blog can have many comments.

## Local MySQL

The root `docker-compose.yml` defines one MySQL 8.0 service:

- Service: `mysql`
- Container: `codex_cli_miniblog_mysql`
- Database: `miniblog`
- User: `miniblog`
- Host port: `3307`
- Container port: `3306`
- Data volume: `codex_cli_miniblog_data`

Use `.env.example` as the template for local settings:

```bash
cp .env.example .env
```

Replace the placeholder values in `.env` with local-only database credentials before starting MySQL or sourcing the file.

Start MySQL from the project root:

```bash
docker compose up -d mysql
```

When running Flask, migrations, or other tools on the host machine, use the Compose host port:

```text
mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3307/miniblog
```

When running an application container on the Docker Compose network, use the MySQL service name and container port:

```text
mysql+pymysql://miniblog:miniblog_password@mysql:3306/miniblog
```

The host URI uses `127.0.0.1:3307` because Docker publishes container port `3306` on host port `3307`. The container URI uses `mysql:3306` because containers resolve the Compose service name directly on the Docker network and connect to MySQL's internal port.

The backend reads `DATABASE_URL` first, then `SQLALCHEMY_DATABASE_URI`, and falls back to its built-in local URI when neither variable is set. Use `.env.example` for the documented host-machine setup. The Compose API service overrides `DATABASE_URL` to the `mysql:3306` form for container usage.

## Railway MySQL

Railway can provide the MySQL connection URL through its Variables UI. In Railway, it is valid to set:

```text
DATABASE_URL=${{mysql.MYSQL_URL}}
```

This is a Railway Variables UI expression only. Do not put this expression, resolved secrets, or deployment credentials in local `.env` files or commit them to the repository.

Railway may resolve that variable to a URL that starts with:

```text
mysql://
```

The backend uses SQLAlchemy with PyMySQL, so it normalizes only the database URL scheme. A `DATABASE_URL` that starts with `mysql://` is converted to `mysql+pymysql://` automatically. A `DATABASE_URL` that already starts with `mysql+pymysql://` is used unchanged. The normalization does not depend on `MINIBLOG_ENV` and does not assume a hostname, port, or database name.

The Compose API service also sets `MINIBLOG_ENV=production`; keep a strong non-placeholder `JWT_SECRET_KEY` in `.env` before starting that container.

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
flask --app app run --debug --port 8080
```

Verify the existing health endpoint:

```bash
curl http://127.0.0.1:8080/health
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

Apply existing migrations from the API container after MySQL is running, from the project root:

```bash
docker compose run --rm api flask --app app db upgrade
```

Commit generated migration files with the model changes that require them.
