from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


def _error_response(
    status_code: int,
    code: str,
    message: str,
    fields: dict[str, str] | None = None,
):
    error: dict[str, Any] = {"code": code, "message": message}
    if fields is not None:
        error["fields"] = fields

    return jsonify({"error": error}), status_code


def _validate_registration_payload(payload: Any) -> tuple[dict[str, str], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, str] = {}

    if not isinstance(payload, dict):
        return data, {"body": "Request body must be a JSON object."}

    raw_name = payload.get("name")
    name = raw_name.strip() if isinstance(raw_name, str) else ""
    if not name:
        fields["name"] = "Name is required."
    elif len(name) > 120:
        fields["name"] = "Name must be 120 characters or fewer."
    else:
        data["name"] = name

    raw_email = payload.get("email")
    email = raw_email.strip().lower() if isinstance(raw_email, str) else ""
    if not email:
        fields["email"] = "Email is required."
    elif len(email) > 255 or EMAIL_PATTERN.fullmatch(email) is None:
        fields["email"] = "Enter a valid email address."
    else:
        data["email"] = email

    password = payload.get("password")
    if not isinstance(password, str) or not password:
        fields["password"] = "Password is required."
    elif len(password) < MIN_PASSWORD_LENGTH:
        fields["password"] = "Password must be at least 8 characters."
    else:
        data["password"] = password

    return data, fields


def _validate_login_payload(payload: Any) -> tuple[dict[str, str], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, str] = {}

    if not isinstance(payload, dict):
        return data, {"body": "Request body must be a JSON object."}

    raw_email = payload.get("email")
    email = raw_email.strip().lower() if isinstance(raw_email, str) else ""
    if not email:
        fields["email"] = "Email is required."
    elif len(email) > 255 or EMAIL_PATTERN.fullmatch(email) is None:
        fields["email"] = "Enter a valid email address."
    else:
        data["email"] = email

    password = payload.get("password")
    if not isinstance(password, str) or not password:
        fields["password"] = "Password is required."
    else:
        data["password"] = password

    return data, fields


def _public_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }


def _create_access_token(user: User) -> str:
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY must be configured.")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(
        seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES_SECONDS"]
    )
    payload = {
        "sub": str(user.id),
        "user": _public_user(user),
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(payload, secret_key, algorithm="HS256")


def _authentication_error():
    return _error_response(
        401,
        "UNAUTHORIZED",
        "A valid bearer token is required.",
    )


def _current_user_from_authorization_header() -> User | None:
    authorization = request.headers.get("Authorization", "")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY must be configured.")

    try:
        payload = jwt.decode(parts[1], secret_key, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError, jwt.InvalidTokenError):
        return None

    return db.session.get(User, user_id)


@auth_bp.post("/register")
def register():
    data, fields = _validate_registration_payload(request.get_json(silent=True))
    if fields:
        return _error_response(
            400,
            "VALIDATION_ERROR",
            "Invalid registration request.",
            fields,
        )

    existing_user = User.query.filter_by(email=data["email"]).first()
    if existing_user is not None:
        return _error_response(
            409,
            "EMAIL_ALREADY_EXISTS",
            "Email is already registered.",
        )

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
    )
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return _error_response(
            409,
            "EMAIL_ALREADY_EXISTS",
            "Email is already registered.",
        )

    return jsonify({"user": _public_user(user)}), 201


@auth_bp.post("/login")
def login():
    data, fields = _validate_login_payload(request.get_json(silent=True))
    if fields:
        return _error_response(
            400,
            "VALIDATION_ERROR",
            "Invalid login request.",
            fields,
        )

    user = User.query.filter_by(email=data["email"]).first()
    if user is None or not check_password_hash(user.password_hash, data["password"]):
        return _error_response(
            401,
            "INVALID_CREDENTIALS",
            "Invalid email or password.",
        )

    return jsonify(
        {"accessToken": _create_access_token(user), "user": _public_user(user)}
    ), 200


@auth_bp.get("/me")
def current_user():
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    return jsonify({"user": _public_user(user)}), 200
