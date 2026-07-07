# MiniBlog API

Minimal Flask API scaffold for the MiniBlog backend.

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

The default local database URL is:

```text
mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3306/miniblog
```

The Flask app reads `DATABASE_URL` first, then `SQLALCHEMY_DATABASE_URI`, and finally falls back to the default local database URL.

## Run

```bash
flask --app app run --debug
```

The API will be available at `http://127.0.0.1:5000`.

## Health Check

```bash
curl http://127.0.0.1:5000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Verify

```bash
python3 -m compileall app
```

Apply database migrations after MySQL is running:

```bash
cd apps/api
set -a
source ../../.env
set +a
flask --app app db upgrade
```

Database models, auth, blog routes, and comment routes are intentionally not implemented yet. SQLAlchemy and Flask-Migrate are configured against the local MySQL URI.
