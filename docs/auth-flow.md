# Auth Flow

## Registration

1. User submits name, email, and password.
2. Backend validates the request body.
3. Backend stores the user with a secure password hash.
4. Backend returns the public user object.

Registration does not log the user in, return JWTs, set cookies, or create refresh-token state yet.

## Login

1. User submits email and password.
2. Backend validates request fields and normalizes the email.
3. Backend verifies the stored password hash.
4. Backend signs an access-token JWT with `JWT_SECRET_KEY`.
5. Backend signs a refresh-token JWT with `JWT_SECRET_KEY`.
6. Backend sets the refresh token in an HTTP-only cookie.
7. Backend returns the access token and the public user object.

The access token expires after `JWT_ACCESS_TOKEN_EXPIRES_SECONDS` seconds. The default expiration is 900 seconds.

The refresh token expires after `JWT_REFRESH_TOKEN_EXPIRES_SECONDS` seconds. The default expiration is 604800 seconds.

The refresh-token cookie defaults to:

- Name: `refreshToken`
- `HttpOnly`
- `SameSite=Lax`
- `Path=/auth`
- `Secure=false` for local HTTP development

Set `REFRESH_TOKEN_COOKIE_SECURE=true` for HTTPS environments.

Login does not create database-backed refresh-token state yet.

Browser clients must send auth requests from an allowed `CORS_ORIGINS` origin and include credentials when they need the refresh-token cookie to be set or sent.

## Refresh

1. Client sends `POST /auth/refresh` with the refresh-token cookie.
2. Backend verifies the refresh token signature with `JWT_SECRET_KEY`.
3. Backend verifies token expiration and requires the `typ` claim to be `refresh`.
4. Backend reads the user id from the `sub` claim and loads the user from the database.
5. Backend returns a new access-token JWT.

Missing, invalid, expired, non-refresh, or unknown-user refresh tokens return:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid refresh token is required."
  }
}
```

## Protected Routes

Protected API routes must verify authentication before returning data.

Protected API routes require the login access token in the `Authorization` header:

```text
Authorization: Bearer <accessToken>
```

The backend verifies the token signature with `JWT_SECRET_KEY`, verifies token expiration, reads the user id from the `sub` claim, and loads the current user from the database.

`GET /auth/me` returns the public user object for a valid bearer access token. `POST /blogs` uses the same bearer-token validation and creates the blog with `author_id` set to the current user. Missing, malformed, invalid, expired, or unknown-user tokens return:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "A valid bearer token is required."
  }
}
```

## Logout

`POST /auth/logout` clears the refresh-token cookie.

Logout does not revoke already issued access tokens or database-backed refresh-token state yet.
