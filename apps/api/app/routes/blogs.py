from __future__ import annotations

import re
from typing import Any

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload

from app.auth import current_user_from_authorization_header
from app.extensions import db
from app.models.blog import Blog
from app.models.comment import Comment
from app.models.tag import Tag
from app.models.user import User

blogs_bp = Blueprint("blogs", __name__, url_prefix="/blogs")
me_bp = Blueprint("me", __name__, url_prefix="/me")

SLUG_PATTERN = re.compile(r"[^a-z0-9]+")
VALID_STATUSES = {Blog.STATUS_DRAFT, Blog.STATUS_PUBLISHED}
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 10
MAX_PER_PAGE = 50
MAX_SLUG_WRITE_ATTEMPTS = 5
MAX_TAGS_PER_BLOG = 10
MAX_TAG_NAME_LENGTH = 40


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


def _slug_conflict_error():
    return _error_response(
        409,
        "BLOG_SLUG_CONFLICT",
        "Could not allocate a unique blog slug. Please try a different title.",
    )


def _view_forbidden_error():
    return _error_response(
        403,
        "FORBIDDEN",
        "Only the blog author can view this blog.",
    )


def _validate_create_blog_payload(
    payload: Any,
) -> tuple[dict[str, Any], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, Any] = {}

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

    if "tags" in payload:
        tags, tags_error = _validate_tags(payload.get("tags"))
        if tags_error is not None:
            fields["tags"] = tags_error
        else:
            data["tags"] = tags
    else:
        data["tags"] = []

    return data, fields


def _validate_update_blog_payload(
    payload: Any,
) -> tuple[dict[str, Any], dict[str, str]]:
    fields: dict[str, str] = {}
    data: dict[str, Any] = {}

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

    if "tags" in payload:
        tags, tags_error = _validate_tags(payload.get("tags"))
        if tags_error is not None:
            fields["tags"] = tags_error
        else:
            data["tags"] = tags

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


def _normalize_tag_name(value: str) -> str:
    return " ".join(value.strip().split())


def _validate_tags(raw_tags: Any) -> tuple[list[dict[str, str]], str | None]:
    if not isinstance(raw_tags, list):
        return [], "Tags must be an array of strings."

    tags: list[dict[str, str]] = []
    seen_slugs: set[str] = set()

    for raw_tag in raw_tags:
        if not isinstance(raw_tag, str):
            return [], "Tags must be an array of strings."

        name = _normalize_tag_name(raw_tag)
        if not name:
            return [], "Tags cannot include blank names."

        if len(name) > MAX_TAG_NAME_LENGTH:
            return [], f"Each tag must be {MAX_TAG_NAME_LENGTH} characters or fewer."

        slug = _slug_base(name)
        if not slug:
            return [], "Tags must include letters or numbers."

        if slug in seen_slugs:
            continue

        seen_slugs.add(slug)
        tags.append({"name": name, "slug": slug})

    if len(tags) > MAX_TAGS_PER_BLOG:
        return [], f"A blog can have at most {MAX_TAGS_PER_BLOG} tags."

    return tags, None


def _tag_models_for_inputs(tag_inputs: list[dict[str, str]]) -> list[Tag]:
    if not tag_inputs:
        return []

    slugs = [tag_input["slug"] for tag_input in tag_inputs]
    existing_tags = Tag.query.filter(Tag.slug.in_(slugs)).all()
    tags_by_slug = {tag.slug: tag for tag in existing_tags}
    tags: list[Tag] = []

    for tag_input in tag_inputs:
        tag = tags_by_slug.get(tag_input["slug"])
        if tag is None:
            tag = Tag(name=tag_input["name"], slug=tag_input["slug"])
            db.session.add(tag)
            tags_by_slug[tag.slug] = tag
        tags.append(tag)

    return tags


def _unique_slug(
    title: str,
    exclude_blog_id: int | None = None,
    rejected_slugs: set[str] | None = None,
) -> str:
    base_slug = _slug_base(title)
    slug = base_slug
    suffix = 2
    rejected_slugs = rejected_slugs or set()

    while True:
        existing_blog = Blog.query.filter_by(slug=slug).first()
        if slug not in rejected_slugs and (
            existing_blog is None or existing_blog.id == exclude_blog_id
        ):
            return slug

        slug = f"{base_slug}-{suffix}"
        suffix += 1


def _is_slug_integrity_error(error: IntegrityError) -> bool:
    message = str(error).lower()
    return "slug" in message and ("unique" in message or "duplicate" in message)


def _commit_new_blog_with_slug_retry(
    data: dict[str, Any],
    author_id: int,
) -> tuple[Blog | None, Any]:
    rejected_slugs: set[str] = set()

    for _ in range(MAX_SLUG_WRITE_ATTEMPTS):
        slug = _unique_slug(data["title"], rejected_slugs=rejected_slugs)
        blog = Blog(
            title=data["title"],
            slug=slug,
            excerpt=data["excerpt"],
            content=data["content"],
            status=data["status"],
            author_id=author_id,
        )
        blog.tags = _tag_models_for_inputs(data.get("tags", []))
        db.session.add(blog)

        try:
            db.session.commit()
            return blog, None
        except IntegrityError as error:
            db.session.rollback()
            if not _is_slug_integrity_error(error):
                raise
            rejected_slugs.add(slug)

    return None, _slug_conflict_error()


def _apply_blog_update(
    blog: Blog,
    data: dict[str, Any],
    rejected_slugs: set[str],
) -> str | None:
    attempted_slug = None

    if "title" in data:
        title = data["title"]
        if title != blog.title:
            blog.title = title
            blog.slug = _unique_slug(
                title,
                exclude_blog_id=blog.id,
                rejected_slugs=rejected_slugs,
            )
            attempted_slug = blog.slug

    if "excerpt" in data:
        blog.excerpt = data["excerpt"]

    if "content" in data:
        blog.content = data["content"]

    if "status" in data:
        blog.status = data["status"]

    if "tags" in data:
        blog.tags = _tag_models_for_inputs(data["tags"])

    return attempted_slug


def _commit_blog_update_with_slug_retry(
    blog: Blog,
    data: dict[str, Any],
) -> tuple[Blog | None, Any]:
    blog_id = blog.id
    rejected_slugs: set[str] = set()

    for _ in range(MAX_SLUG_WRITE_ATTEMPTS):
        current_blog = db.session.get(Blog, blog_id)
        if current_blog is None:
            return None, _blog_not_found_error()

        attempted_slug = _apply_blog_update(current_blog, data, rejected_slugs)

        try:
            db.session.commit()
            return current_blog, None
        except IntegrityError as error:
            db.session.rollback()
            if attempted_slug is None or not _is_slug_integrity_error(error):
                raise
            rejected_slugs.add(attempted_slug)

    return None, _slug_conflict_error()


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


def _serialize_tag(tag: Tag) -> dict[str, Any]:
    return {
        "id": tag.id,
        "name": tag.name,
        "slug": tag.slug,
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
        "tags": [
            _serialize_tag(tag)
            for tag in sorted(blog.tags, key=lambda tag: (tag.name.lower(), tag.id))
        ],
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
    user = current_user_from_authorization_header()
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

    blog, error_response = _commit_new_blog_with_slug_retry(data, user.id)
    if error_response is not None:
        return error_response

    return jsonify({"blog": _serialize_blog(blog)}), 201


@blogs_bp.patch("/<slug>")
def update_blog(slug: str):
    user = current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    blog = Blog.query.options(selectinload(Blog.tags)).filter_by(slug=slug).first()
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

    blog, error_response = _commit_blog_update_with_slug_retry(blog, data)
    if error_response is not None:
        return error_response

    return jsonify({"blog": _serialize_blog(blog)}), 200


@blogs_bp.delete("/<slug>")
def delete_blog(slug: str):
    user = current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    blog = Blog.query.options(selectinload(Blog.tags)).filter_by(slug=slug).first()
    if blog is None:
        return _blog_not_found_error()

    if blog.author_id != user.id:
        return _delete_forbidden_error()

    db.session.delete(blog)
    db.session.commit()

    return jsonify({"message": "Blog deleted."}), 200


@blogs_bp.get("/<slug>/mine")
def get_my_blog(slug: str):
    user = current_user_from_authorization_header()
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
    user = current_user_from_authorization_header()
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


@me_bp.get("/blogs")
def list_my_blogs():
    user = current_user_from_authorization_header()
    if user is None:
        return _authentication_error()

    page = _pagination_value("page", DEFAULT_PAGE)
    per_page = _pagination_value("perPage", DEFAULT_PER_PAGE, MAX_PER_PAGE)
    query = (
        Blog.query.options(joinedload(Blog.author), selectinload(Blog.tags))
        .filter_by(author_id=user.id)
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


@blogs_bp.get("")
def list_blogs():
    page = _pagination_value("page", DEFAULT_PAGE)
    per_page = _pagination_value("perPage", DEFAULT_PER_PAGE, MAX_PER_PAGE)
    tag_slug = (request.args.get("tag") or "").strip().lower()
    query = (
        Blog.query.options(joinedload(Blog.author), selectinload(Blog.tags))
        .filter_by(status=Blog.STATUS_PUBLISHED)
        .order_by(Blog.created_at.desc(), Blog.id.desc())
    )
    if tag_slug:
        query = query.join(Blog.tags).filter(Tag.slug == tag_slug)

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
        Blog.query.options(joinedload(Blog.author), selectinload(Blog.tags))
        .filter_by(slug=slug, status=Blog.STATUS_PUBLISHED)
        .first()
    )
    if blog is None:
        return _blog_not_found_error()

    return jsonify({"blog": _serialize_public_blog(blog)}), 200
