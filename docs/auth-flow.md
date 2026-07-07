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
4. Backend returns the public user object.

Login does not return JWTs, set cookies, or create refresh-token state yet.

## Protected Routes

Protected API routes must verify authentication before returning data.

## Logout

Logout clears session/token state.
