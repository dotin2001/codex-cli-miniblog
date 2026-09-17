from __future__ import annotations

from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy.orm import joinedload

from app.auth import current_user_from_authorization_header
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
    user = current_user_from_authorization_header()
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
    user = current_user_from_authorization_header()
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
