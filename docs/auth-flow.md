# Auth Flow

## Login

1. User submits email and password.
2. Backend validates credentials.
3. Backend returns access token or sets secure cookie depending on implementation.
4. Frontend stores auth state safely.

## Protected Routes

Protected API routes must verify authentication before returning data.

## Logout

Logout clears session/token state.
