from __future__ import annotations

import re
from typing import Any

import jwt
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.blog import Blog
from app.models.comment import Comment
from app.models.user import User

blogs_bp = Blueprint("blogs", __name__, url_prefix="/blogs")

SLUG_PATTERN = re.compile(r"[^a-z0-9]+")
VALID_STATUSES = {Blog.STATUS_DRAFT, Blog.STATUS_PUBLISHED}
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10
MAX_PER_PAGE = 50


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


def _blog_not_found_error():
    return _error_response(
        404,
        "BLOG_NOT_FOUND",
        "Blog was not found.",
    )


def _forbidden_error():
    return _error_response(
        403,
        "FORBIDDEN",
        "Only the blog author can update this blog.",
    )


def _delete_forbidden_error():
    return _error_response(
        403,
        "FORBIDDEN",
        "Only the blog author can delete this blog.",
    )


def _view_forbidden_error():
    return _error_response(
        403,
        "FORBIDDEN",
        "Only the blog author can view this blog.",
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


def _validate_update_blog_payload(
    payload: Any,
) -> tuple[dict[str, str | None], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, str | None] = {}

    if not isinstance(payload, dict):
        return data, {"body": "Request body must be a JSON object."}

    if "title" in payload:
        raw_title = payload.get("title")
        title = raw_title.strip() if isinstance(raw_title, str) else ""
        if not title:
            fields["title"] = "Title cannot be blank."
        elif len(title) > 255:
            fields["title"] = "Title must be 255 characters or fewer."
        elif not _slug_base(title):
            fields["title"] = "Title must include letters or numbers."
        else:
            data["title"] = title

    if "content" in payload:
        raw_content = payload.get("content")
        content = raw_content.strip() if isinstance(raw_content, str) else ""
        if not content:
            fields["content"] = "Content cannot be blank."
        else:
            data["content"] = content

    if "excerpt" in payload:
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

    if "status" in payload:
        raw_status = payload.get("status")
        status = raw_status.strip() if isinstance(raw_status, str) else ""
        if status not in VALID_STATUSES:
            fields["status"] = "Status must be draft or published."
        else:
            data["status"] = status

    return data, fields


def _validate_create_comment_payload(
    payload: Any,
) -> tuple[dict[str, str], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, str] = {}

    if not isinstance(payload, dict):
        return data, {"body": "Request body must be a JSON object."}

    raw_content = payload.get("content")
    content = raw_content.strip() if isinstance(raw_content, str) else ""
    if not content:
        fields["content"] = "Content is required."
    else:
        data["content"] = content

    return data, fields


def _slug_base(title: str) -> str:
    return SLUG_PATTERN.sub("-", title.lower()).strip("-")


def _unique_slug(title: str, exclude_blog_id: int | None = None) -> str:
    base_slug = _slug_base(title)
    slug = base_slug
    suffix = 2

    while True:
        existing_blog = Blog.query.filter_by(slug=slug).first()
        if existing_blog is None or existing_blog.id == exclude_blog_id:
            return slug

        slug = f"{base_slug}-{suffix}"
        suffix += 1


def _pagination_value(name: str, default: int, maximum: int | None = None) -> int:
    try:
        value = int(request.args.get(name, default))
    except (TypeError, ValueError):
        return default

    if value < 1:
        return default

    if maximum is not None:
        return min(value, maximum)

    return value


def _serialize_author(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
    }


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


def _serialize_public_blog(blog: Blog) -> dict[str, Any]:
    return {
        **_serialize_blog(blog),
        "author": _serialize_author(blog.author),
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


def _published_blog_by_slug(slug: str) -> Blog | None:
    return Blog.query.filter_by(slug=slug, status=Blog.STATUS_PUBLISHED).first()


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


@blogs_bp.patch("/<slug>")
def update_blog(slug: str):
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    blog = Blog.query.filter_by(slug=slug).first()
    if blog is None:
        return _blog_not_found_error()

    if blog.author_id != user.id:
        return _forbidden_error()

    data, fields = _validate_update_blog_payload(request.get_json(silent=True))
    if fields:
        return _error_response(
            400,
            "VALIDATION_ERROR",
            "Invalid blog request.",
            fields,
        )

    if "title" in data:
        title = data["title"]
        if title != blog.title:
            blog.title = title
            blog.slug = _unique_slug(title, exclude_blog_id=blog.id)

    if "excerpt" in data:
        blog.excerpt = data["excerpt"]

    if "content" in data:
        blog.content = data["content"]

    if "status" in data:
        blog.status = data["status"]

    db.session.commit()

    return jsonify({"blog": _serialize_blog(blog)}), 200


@blogs_bp.delete("/<slug>")
def delete_blog(slug: str):
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    blog = Blog.query.filter_by(slug=slug).first()
    if blog is None:
        return _blog_not_found_error()

    if blog.author_id != user.id:
        return _delete_forbidden_error()

    db.session.delete(blog)
    db.session.commit()

    return jsonify({"message": "Blog deleted."}), 200


@blogs_bp.get("/<slug>/mine")
def get_my_blog(slug: str):
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    blog = Blog.query.filter_by(slug=slug).first()
    if blog is None:
        return _blog_not_found_error()

    if blog.author_id != user.id:
        return _view_forbidden_error()

    return jsonify({"blog": _serialize_blog(blog)}), 200


@blogs_bp.post("/<slug>/comments")
def create_comment(slug: str):
    user = _current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    blog = _published_blog_by_slug(slug)
    if blog is None:
        return _blog_not_found_error()

    data, fields = _validate_create_comment_payload(request.get_json(silent=True))
    if fields:
        return _error_response(
            400,
            "VALIDATION_ERROR",
            "Invalid comment request.",
            fields,
        )

    comment = Comment(
        content=data["content"],
        author_id=user.id,
        blog_id=blog.id,
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({"comment": _serialize_comment(comment)}), 201


@blogs_bp.get("/<slug>/comments")
def list_comments(slug: str):
    blog = _published_blog_by_slug(slug)
    if blog is None:
        return _blog_not_found_error()

    comments = (
        Comment.query.options(joinedload(Comment.author))
        .filter_by(blog_id=blog.id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
        .all()
    )

    return jsonify(
        {"comments": [_serialize_comment(comment) for comment in comments]}
    ), 200


@blogs_bp.get("")
def list_blogs():
    page = _pagination_value("page", DEFAULT_PAGE)
    per_page = _pagination_value("perPage", DEFAULT_PER_PAGE, MAX_PER_PAGE)
    query = (
        Blog.query.options(joinedload(Blog.author))
        .filter_by(status=Blog.STATUS_PUBLISHED)
        .order_by(Blog.created_at.desc(), Blog.id.desc())
    )
    total = query.count()
    blogs = query.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page

    return jsonify(
        {
            "blogs": [_serialize_public_blog(blog) for blog in blogs],
            "pagination": {
                "page": page,
                "perPage": per_page,
                "total": total,
                "totalPages": total_pages,
            },
        }
    ), 200


@blogs_bp.get("/<slug>")
def get_blog(slug: str):
    blog = (
        Blog.query.options(joinedload(Blog.author))
        .filter_by(slug=slug, status=Blog.STATUS_PUBLISHED)
        .first()
    )
    if blog is None:
        return _blog_not_found_error()

    return jsonify({"blog": _serialize_public_blog(blog)}), 200
