# Database

MiniBlog is configured for local MySQL development through Docker Compose. The backend uses SQLAlchemy, Flask-Migrate, and the PyMySQL driver.

The application tables are `users`, `blogs`, `comments`, `tags`, and `blog_tags`.

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

- One user can author many blog records through `blogs.author_id`; database-level user deletion is restricted while authored blogs exist.
- One user can author many comment records through `comments.author_id`; database-level user deletion is restricted while authored comments exist.

### blogs

Stores blog post records for blog CRUD. Comment create, list, update, and delete routes are implemented. Tags are implemented through reusable `tags` records and the `blog_tags` association table. Likes and categories are not implemented yet.

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
- One blog can have many comments through `comments.blog_id`; database-level blog deletion cascades to owned comments.
- One blog can have many tags through `blog_tags.blog_id`; database-level blog deletion cascades to owned blog-tag associations.

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

### tags

Stores reusable tag records for blog topics. Blog create and update requests accept tag names; the backend normalizes each tag to a unique slug and reuses an existing tag when the slug already exists.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | integer | primary key | Internal tag identifier. |
| `name` | string(40) | not null | Display name shown in blog responses and UI. |
| `slug` | string(40) | not null, unique, indexed | URL-safe tag identifier used by `GET /blogs?tag=<tag-slug>`. |
| `created_at` | datetime | not null, default current timestamp | Record creation timestamp. |
| `updated_at` | datetime | not null, default current timestamp | Record update timestamp. |

Relationship:

- One tag can be associated with many blogs through `blog_tags.tag_id`.

### blog_tags

Associates blogs with reusable tags.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `blog_id` | integer | primary key, foreign key to `blogs.id` | Blog associated with the tag. |
| `tag_id` | integer | primary key, foreign key to `tags.id` | Tag associated with the blog. |

Relationship:

- Each row links one blog to one tag.
- `(blog_id, tag_id)` is unique through the composite primary key and explicit unique constraint.

## Indexing Guidance

Current schema indexes:

- `users.email` is unique and indexed for registration and login lookup.
- `blogs.slug` is unique and indexed for public detail, author edit, update, and delete routes.
- `blogs(status, created_at, id)` for `GET /blogs`, which filters published posts and sorts newest first.
- `blogs(author_id, created_at, id)` for `GET /me/blogs`, which filters by author and sorts newest first.
- `comments(blog_id, created_at, id)` for `GET /blogs/:slug/comments`, which filters by blog and sorts oldest first.
- `tags.slug` is unique and indexed for tag lookup and public tag filtering.
- `blog_tags(tag_id, blog_id)` supports `GET /blogs?tag=<tag-slug>` joins from a tag to associated blogs.

When list traffic grows beyond the current route patterns, add indexes through Flask-Migrate migrations rather than changing models only. High-value future candidates include:

- `comments(author_id)` only if user comment history or moderation views are added.

Do not document future candidates as current schema until a matching migration exists.

## Foreign Key Delete Behavior

Current database-level delete behavior:

- `blogs.author_id -> users.id` restricts user deletion while authored blogs exist.
- `comments.author_id -> users.id` restricts user deletion while authored comments exist.
- `comments.blog_id -> blogs.id` cascades blog deletion to owned comments.
- `blog_tags.blog_id -> blogs.id` cascades blog deletion to owned blog-tag associations.
- `blog_tags.tag_id -> tags.id` cascades tag deletion to owned blog-tag associations.

The ORM also cascades blog deletion to comments through the `Blog.comments` relationship. Blog-tag associations are removed through the `blog_tags` foreign-key cascade when a blog is deleted.

## Schema Evolution Rules

- Keep schema changes small and reversible where possible.
- Update SQLAlchemy models, create a migration, and update this document in the same change.
- Review autogenerated migrations before committing them.
- Avoid destructive migrations, backfills, and new non-null columns on live tables unless the rollout is planned.
- Keep runtime behavior MySQL-compatible even when backend tests use in-memory SQLite.
- Prefer ORM query composition over raw SQL unless a migration, vendor-specific operation, or measured performance issue requires raw SQL.

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

Railway API deployments use the repository root `Dockerfile`, which packages `apps/api` and starts with `sh ./start-api.sh`. The startup script runs `flask --app app db upgrade` with retries before starting Gunicorn, so Railway deploys apply pending migrations before serving requests. If Railway has a custom Start Command, set it to `sh ./start-api.sh`; starting Gunicorn directly bypasses migrations and can leave new tables such as `blog_tags` missing.

### Diagnosing Missing `blog_tags` On Railway

If Railway logs show an error such as:

```text
pymysql.err.ProgrammingError: (1146, "Table 'railway.blog_tags' doesn't exist")
```

while handling `GET /blogs`, the deployed API code is newer than the connected
database schema. Blog list queries eager-load `Blog.tags` through the
`blog_tags` association table, so a missing table means the pending migrations
that create or repair `tags` and `blog_tags` have not been applied to that
database before traffic reached Gunicorn.

Check the Railway service configuration first:

- Confirm the service uses the repository root `Dockerfile`.
- Confirm the Railway Start Command is `sh ./start-api.sh`, or remove any
  custom command that starts Gunicorn directly.
- Redeploy the current image after fixing the start command.
- Confirm deployment logs show migration startup before Gunicorn, including:

```text
Running database migrations before API start, attempt 1/12...
Database migrations are up to date.
```

If the table is still missing, run `flask --app app db upgrade` against the same
Railway MySQL database used by the API service, or use a Railway one-off command
that invokes the same migration command in the deployed environment. Do not use
`db.create_all()` as a production repair path; it bypasses Alembic migration
history and can create schema drift that later migrations cannot reason about.
Do not paste resolved Railway database URLs, passwords, or tokens into committed
files or shared logs.

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

The API startup script applies pending migrations before Gunicorn starts. For one-off local migration checks in the API container, run from the project root:

```bash
docker compose run --rm api flask --app app db upgrade
```

Commit generated migration files with the model changes that require them.
