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
5. Backend returns the access token and the public user object.

The access token expires after `JWT_ACCESS_TOKEN_EXPIRES_SECONDS` seconds. The default expiration is 900 seconds.

Login does not set cookies or create refresh-token state yet.

## Protected Routes

Protected API routes must verify authentication before returning data.

Future protected API routes should require the login access token as a bearer token and verify its signature and expiration before returning private data.

## Logout

Logout clears session/token state.

Logout and refresh-token behavior are not implemented yet.
