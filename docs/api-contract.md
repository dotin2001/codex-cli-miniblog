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

### POST /auth/login

Verifies a user's email and password. On success, this endpoint returns a signed access-token JWT and the public user object. It also sets a refresh-token cookie for issuing later access tokens.

Request body:

```json
{
  "email": "ada@example.com",
  "password": "correct-horse-battery"
}
```

Validation:

- `email` is required, trimmed, lowercased before lookup, and must be a valid email address.
- `password` is required.

Success response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com"
  }
}
```

Access token:

- Signed with HS256 using backend config value `JWT_SECRET_KEY`.
- Expires after `JWT_ACCESS_TOKEN_EXPIRES_SECONDS` seconds. The default is 900 seconds.
- Includes `sub` as the user id string, `user` as the public user object, and standard `iat` and `exp` claims.

Refresh token cookie:

- Cookie name defaults to `refreshToken`.
- Signed with HS256 using backend config value `JWT_SECRET_KEY`.
- Expires after `JWT_REFRESH_TOKEN_EXPIRES_SECONDS` seconds. The default is 604800 seconds.
- Uses `HttpOnly`, `SameSite=Lax`, and `Path=/auth`.
- Uses `Secure=false` by default so it works over local HTTP development. Set `REFRESH_TOKEN_COOKIE_SECURE=true` for HTTPS environments.
- Includes `sub` as the user id string, `typ` as `refresh`, and standard `iat` and `exp` claims.

Status code:

```text
200 OK
```

Validation error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid login request.",
    "fields": {
      "email": "Enter a valid email address.",
      "password": "Password is required."
    }
  }
}
```

Status code:

```text
400 Bad Request
```

Invalid credentials error response:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

Status code:

```text
401 Unauthorized
```

Example:

```bash
curl -X POST http://127.0.0.1:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"correct-horse-battery"}'
```

### POST /auth/refresh

Issues a new access-token JWT from a valid refresh-token cookie.

Request body: none.

Cookies:

```text
refreshToken=<refresh-token-jwt>
```

Success response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Status code:

```text
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid refresh token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the refresh-token cookie is missing, invalid, expired, not a refresh token, or references a user that no longer exists.

Example:

```bash
curl -X POST http://127.0.0.1:5000/auth/refresh \
  --cookie "refreshToken=<refresh-token-jwt>"
```

### POST /auth/logout

Clears the refresh-token cookie.

Request body: none.

Success response:

```json
{
  "message": "Logged out."
}
```

Status code:

```text
200 OK
```

Example:

```bash
curl -X POST http://127.0.0.1:5000/auth/logout
```

### GET /auth/me

Returns the current authenticated user for a valid access-token JWT.

Request body: none.

Headers:

```text
Authorization: Bearer <accessToken>
```

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
200 OK
```

Authentication error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

Status code:

```text
401 Unauthorized
```

The authentication error response is returned when the `Authorization` header is missing, malformed, uses an invalid token, uses an expired token, or references a user that no longer exists.

Example:

```bash
curl http://127.0.0.1:5000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

## Future API Placeholders

The following API areas are planned or partially implemented.

### Auth

Current status:

- `POST /auth/register` is implemented.
- `POST /auth/login` is implemented.
- Login returns an access-token JWT.
- Login sets an HTTP-only refresh-token cookie.
- `POST /auth/refresh` is implemented and issues a new access-token JWT from a valid refresh-token cookie.
- `POST /auth/logout` is implemented and clears the refresh-token cookie.
- `GET /auth/me` is implemented and requires a valid bearer access token.

### Users

Planned endpoints may include:

- `GET /users/me`
- `PATCH /users/me`

Current status:

- User model and registration persistence are implemented.
- The current authenticated user is available through `GET /auth/me`.
- Editable profile endpoints are not implemented.

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
