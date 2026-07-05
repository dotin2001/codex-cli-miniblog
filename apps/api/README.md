# MiniBlog API

Minimal Flask API scaffold for the MiniBlog backend.

## Setup

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

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

Database and auth are intentionally not implemented yet. SQLAlchemy is available as an extension and will initialize when `SQLALCHEMY_DATABASE_URI` is configured later.
