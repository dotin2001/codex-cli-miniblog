from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from flask import current_app, request

from app.extensions import db
from app.models.user import User


def public_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(
        seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES_SECONDS"]
    )
    payload = {
        "sub": str(user.id),
        "user": public_user(user),
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(payload, _jwt_secret_key(), algorithm="HS256")


def create_refresh_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(
        seconds=current_app.config["JWT_REFRESH_TOKEN_EXPIRES_SECONDS"]
    )
    payload = {
        "sub": str(user.id),
        "typ": "refresh",
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(payload, _jwt_secret_key(), algorithm="HS256")


def current_user_from_authorization_header() -> User | None:
    authorization = request.headers.get("Authorization", "")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    try:
        payload = jwt.decode(parts[1], _jwt_secret_key(), algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError, jwt.InvalidTokenError):
        return None

    return db.session.get(User, user_id)


def current_user_from_refresh_cookie() -> User | None:
    refresh_token = request.cookies.get(current_app.config["REFRESH_TOKEN_COOKIE_NAME"])
    if not refresh_token:
        return None

    try:
        payload = jwt.decode(refresh_token, _jwt_secret_key(), algorithms=["HS256"])
        if payload.get("typ") != "refresh":
            return None

        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError, jwt.InvalidTokenError):
        return None

    return db.session.get(User, user_id)


def _jwt_secret_key() -> str:
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY must be configured.")

    return secret_key
