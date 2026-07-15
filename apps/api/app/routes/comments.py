from __future__ import annotations

from typing import Any

import jwt
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.comment import Comment
from app.models.user import User

comments_bp = Blueprint("comments", __name__, url_prefix="/comments")


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


def _comment_not_found_error():
    return _error_response(
        404,
        "COMMENT_NOT_FOUND",
        "Comment was not found.",
    )


def _update_forbidden_error():
    return _error_response(
        403,
        "FORBIDDEN",
        "Only the comment author can update this comment.",
    )


def _delete_forbidden_error():
    return _error_response(
        403,
        "FORBIDDEN",
        "Only the comment author can delete this comment.",
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


def _validate_update_comment_payload(
    payload: Any,
) -> tuple[dict[str, str], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, str] = {}

    if not isinstance(payload, dict):
        return data, {"body": "Request body must be a JSON object."}

    raw_content = payload.get("content")
    content = raw_content.strip() if isinstance(raw_content, str) else ""
    if not content:
        fields["content"] = "Content cannot be blank."
    else:
        data["content"] = content

    return data, fields


def _serialize_author(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
    }


def _serialize_comment(comment: Comment) -> dict[str, Any]:
    return {
        "id": comment.id,
        "content": comment.content,
        "authorId": comment.author_id,
        "blogId": comment.blog_id,
        "createdAt": comment.created_at.isoformat(),
        "updatedAt": comment.updated_at.isoformat(),
        "author": _serialize_author(comment.author),
    }


def _comment_by_id(comment_id: int) -> Comment | None:
    return (
        Comment.query.options(joinedload(Comment.author))
        .filter_by(id=comment_id)
        .first()
    )


@comments_bp.patch("/<int:comment_id>")
def update_comment(comment_id: int):
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    comment = _comment_by_id(comment_id)
    if comment is None:
        return _comment_not_found_error()

    if comment.author_id != user.id:
        return _update_forbidden_error()

    data, fields = _validate_update_comment_payload(request.get_json(silent=True))
    if fields:
        return _error_response(
            400,
            "VALIDATION_ERROR",
            "Invalid comment request.",
            fields,
        )

    comment.content = data["content"]
    db.session.commit()

    return jsonify({"comment": _serialize_comment(comment)}), 200


@comments_bp.delete("/<int:comment_id>")
def delete_comment(comment_id: int):
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    comment = _comment_by_id(comment_id)
    if comment is None:
        return _comment_not_found_error()

    if comment.author_id != user.id:
        return _delete_forbidden_error()

    db.session.delete(comment)
    db.session.commit()

    return jsonify({"message": "Comment deleted."}), 200
