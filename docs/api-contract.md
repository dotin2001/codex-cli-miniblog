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

The frontend is not wired to call the backend yet.

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

### POST /auth/register

Creates a user account. This endpoint stores a securely hashed password and does not return tokens, set cookies, log the user in, or create refresh-token state.

Request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct-horse-battery"
}
```

Validation:

- `name` is required, trimmed before storage, and must be 120 characters or fewer.
- `email` is required, trimmed, lowercased before storage, must be a valid email address, and must be unique.
- `password` is required and must be at least 8 characters.

Success response:

```json
{
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

Status code:

```text
201 Created
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid registration request.",
    "fields": {
      "name": "Name is required.",
      "email": "Enter a valid email address.",
      "password": "Password must be at least 8 characters."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Duplicate email error response:

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email is already registered."
  }
}
```

Status code:

```text
409 Conflict
```

Example:

```bash
curl -X POST http://127.0.0.1:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"correct-horse-battery"}'
```

## Future API Placeholders

The following API areas are planned or partially implemented.

### Auth

Planned endpoints may include:

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`

Current status:

- `POST /auth/register` is implemented.
- No JWT behavior is implemented.
- No refresh token or cookie behavior is implemented.

### Users

Planned endpoints may include:

- `GET /users/me`
- `PATCH /users/me`

Current status:

- User model and registration persistence are implemented.
- Profile endpoints are not implemented.

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

- MySQL is configured for local development through the backend SQLAlchemy settings.
- Update this document whenever a backend endpoint is added or changed.
