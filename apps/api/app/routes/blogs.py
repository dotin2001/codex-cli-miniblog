from __future__ import annotations

import re
from typing import Any

import jwt
from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.blog import Blog
from app.models.user import User

blogs_bp = Blueprint("blogs", __name__, url_prefix="/blogs")

SLUG_PATTERN = re.compile(r"[^a-z0-9]+")
VALID_STATUSES = {Blog.STATUS_DRAFT, Blog.STATUS_PUBLISHED}


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


def _authentication_error():
    return _error_response(
        401,
        "UNAUTHORIZED",
        "A valid bearer token is required.",
    )


def _jwt_secret_key() -> str:
    secret_key = current_app.config.get("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY must be configured.")

    return secret_key


def _current_user_from_authorization_header() -> User | None:
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


def _validate_create_blog_payload(
    payload: Any,
) -> tuple[dict[str, str | None], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, str | None] = {}

    if not isinstance(payload, dict):
        return data, {"body": "Request body must be a JSON object."}

    raw_title = payload.get("title")
    title = raw_title.strip() if isinstance(raw_title, str) else ""
    if not title:
        fields["title"] = "Title is required."
    elif len(title) > 255:
        fields["title"] = "Title must be 255 characters or fewer."
    elif not _slug_base(title):
        fields["title"] = "Title must include letters or numbers."
    else:
        data["title"] = title

    raw_content = payload.get("content")
    content = raw_content.strip() if isinstance(raw_content, str) else ""
    if not content:
        fields["content"] = "Content is required."
    else:
        data["content"] = content

    raw_excerpt = payload.get("excerpt")
    if raw_excerpt is None:
        data["excerpt"] = None
    elif not isinstance(raw_excerpt, str):
        fields["excerpt"] = "Excerpt must be a string."
    else:
        excerpt = raw_excerpt.strip()
        if len(excerpt) > 500:
            fields["excerpt"] = "Excerpt must be 500 characters or fewer."
        else:
            data["excerpt"] = excerpt or None

    raw_status = payload.get("status", Blog.STATUS_DRAFT)
    status = raw_status.strip() if isinstance(raw_status, str) else ""
    if status not in VALID_STATUSES:
        fields["status"] = "Status must be draft or published."
    else:
        data["status"] = status

    return data, fields


def _slug_base(title: str) -> str:
    return SLUG_PATTERN.sub("-", title.lower()).strip("-")


def _unique_slug(title: str) -> str:
    base_slug = _slug_base(title)
    slug = base_slug
    suffix = 2

    while Blog.query.filter_by(slug=slug).first() is not None:
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    return slug


def _serialize_blog(blog: Blog) -> dict[str, Any]:
    return {
        "id": blog.id,
        "title": blog.title,
        "slug": blog.slug,
        "excerpt": blog.excerpt,
        "content": blog.content,
        "status": blog.status,
        "authorId": blog.author_id,
        "createdAt": blog.created_at.isoformat(),
        "updatedAt": blog.updated_at.isoformat(),
    }


@blogs_bp.post("")
def create_blog():
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    data, fields = _validate_create_blog_payload(request.get_json(silent=True))
    if fields:
        return _error_response(
            400,
            "VALIDATION_ERROR",
            "Invalid blog request.",
            fields,
        )

    blog = Blog(
        title=data["title"],
        slug=_unique_slug(data["title"]),
        excerpt=data["excerpt"],
        content=data["content"],
        status=data["status"],
        author_id=user.id,
    )
    db.session.add(blog)
    db.session.commit()

    return jsonify({"blog": _serialize_blog(blog)}), 201
