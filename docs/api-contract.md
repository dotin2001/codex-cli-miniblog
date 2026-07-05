# API Contract

## Local URLs

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://127.0.0.1:5000
```

The frontend is not wired to call the backend yet. The only implemented backend endpoint is the health check.

## Implemented Endpoints

### GET /health

Checks whether the Flask API process is reachable.

Request body: none.

Success response:

```json
{
  "status": "ok"
}
```

Status code:

```text
200 OK
```

Example:

```bash
curl http://127.0.0.1:5000/health
```

## Future API Placeholders

The following API areas are planned but not implemented in the current scaffold.

### Auth

Planned endpoints may include:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

Current status:

- Not implemented.
- No JWT behavior is implemented.
- No refresh token or cookie behavior is implemented.

### Users

Planned endpoints may include:

- `GET /users/me`
- `PATCH /users/me`

Current status:

- Not implemented.
- No user model or persistence is implemented.

### Blogs

Planned endpoints may include:

- `GET /blogs`
- `POST /blogs`
- `GET /blogs/:id`
- `PATCH /blogs/:id`
- `DELETE /blogs/:id`

Current status:

- Not implemented.
- No blog model or persistence is implemented.

### Comments

Planned endpoints may include:

- `GET /blogs/:id/comments`
- `POST /blogs/:id/comments`
- `DELETE /comments/:id`

Current status:

- Not implemented.
- No comment model or persistence is implemented.

## Notes

- MySQL is not connected yet.
- SQLAlchemy is available in the backend scaffold but is not configured with a database URI yet.
- Update this document whenever a backend endpoint is added or changed.
