from datetime import datetime, timedelta, timezone
from unittest.mock import patch
import unittest

import jwt
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.blog import Blog
from app.models.tag import Tag
from app.models.user import User
from app.routes import blogs as blog_routes


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = 900


class UpdateBlogEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            author = User(
                name="Ada Lovelace",
                email="ada@example.com",
                password_hash=generate_password_hash("correct-horse-battery"),
            )
            other_user = User(
                name="Grace Hopper",
                email="grace@example.com",
                password_hash=generate_password_hash("correct-horse-battery"),
            )
            db.session.add_all([author, other_user])
            db.session.commit()
            self.author_id = author.id
            self.other_user_id = other_user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _access_token(self, user_id):
        now = datetime.now(timezone.utc)
        return jwt.encode(
            {
                "sub": str(user_id),
                "iat": now,
                "exp": now + timedelta(minutes=15),
            },
            TestConfig.JWT_SECRET_KEY,
            algorithm="HS256",
        )

    def _auth_headers(self, user_id=None):
        return {
            "Authorization": f"Bearer {self._access_token(user_id or self.author_id)}"
        }

    def _add_blog(
        self,
        title,
        slug,
        author_id=None,
        status=Blog.STATUS_DRAFT,
        excerpt=None,
        content="Blog content",
    ):
        blog = Blog(
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            status=status,
            author_id=author_id or self.author_id,
        )
        db.session.add(blog)
        db.session.commit()
        return blog

    def _add_tag(self, name, slug):
        tag = Tag(name=name, slug=slug)
        db.session.add(tag)
        db.session.commit()
        return tag

    def test_update_blog_changes_fields_and_regenerates_unique_slug_for_author(self):
        with self.app.app_context():
            self._add_blog(title="Existing", slug="updated-title")
            blog = self._add_blog(
                title="Original Title",
                slug="original-title",
                excerpt="Original summary",
                content="Original content",
            )
            blog_id = blog.id

        response = self.client.patch(
            "/blogs/original-title",
            headers=self._auth_headers(),
            json={
                "title": " Updated Title ",
                "excerpt": " Updated summary. ",
                "content": " Updated content. ",
                "status": "published",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {
                "id": response.get_json()["blog"]["id"],
                "title": response.get_json()["blog"]["title"],
                "slug": response.get_json()["blog"]["slug"],
                "excerpt": response.get_json()["blog"]["excerpt"],
                "content": response.get_json()["blog"]["content"],
                "status": response.get_json()["blog"]["status"],
                "authorId": response.get_json()["blog"]["authorId"],
            },
            {
                "id": blog_id,
                "title": "Updated Title",
                "slug": "updated-title-2",
                "excerpt": "Updated summary.",
                "content": "Updated content.",
                "status": "published",
                "authorId": self.author_id,
            },
        )

        with self.app.app_context():
            updated_blog = db.session.get(Blog, blog_id)
            self.assertEqual(updated_blog.slug, "updated-title-2")

    def test_update_blog_keeps_slug_when_title_is_not_changed(self):
        with self.app.app_context():
            blog = self._add_blog(
                title="Stable Title",
                slug="stable-title",
                content="Original content",
            )
            blog_id = blog.id

        response = self.client.patch(
            "/blogs/stable-title",
            headers=self._auth_headers(),
            json={"content": "Only content changed."},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["blog"]["slug"], "stable-title")

        with self.app.app_context():
            updated_blog = db.session.get(Blog, blog_id)
            self.assertEqual(updated_blog.content, "Only content changed.")

    def test_update_blog_replaces_tags_when_tags_are_present(self):
        with self.app.app_context():
            original_tag = self._add_tag("Original", "original")
            blog = self._add_blog(
                title="Tagged Draft",
                slug="tagged-draft",
                content="Original content",
            )
            blog.tags = [original_tag]
            db.session.commit()
            blog_id = blog.id

        response = self.client.patch(
            "/blogs/tagged-draft",
            headers=self._auth_headers(),
            json={"tags": [" SQL ", "Backend", "sql"]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [
                {key: tag[key] for key in ("name", "slug")}
                for tag in response.get_json()["blog"]["tags"]
            ],
            [
                {"name": "Backend", "slug": "backend"},
                {"name": "SQL", "slug": "sql"},
            ],
        )

        with self.app.app_context():
            updated_blog = db.session.get(Blog, blog_id)
            self.assertEqual({tag.slug for tag in updated_blog.tags}, {"backend", "sql"})

    def test_update_blog_preserves_tags_when_tags_are_omitted(self):
        with self.app.app_context():
            original_tag = self._add_tag("Original", "original")
            blog = self._add_blog(
                title="Tagged Draft",
                slug="tagged-draft",
                content="Original content",
            )
            blog.tags = [original_tag]
            db.session.commit()
            blog_id = blog.id

        response = self.client.patch(
            "/blogs/tagged-draft",
            headers=self._auth_headers(),
            json={"content": "Updated content."},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["blog"]["tags"][0]["slug"], "original")

        with self.app.app_context():
            updated_blog = db.session.get(Blog, blog_id)
            self.assertEqual([tag.slug for tag in updated_blog.tags], ["original"])

    def test_update_blog_rejects_invalid_tags_without_changing_existing_tags(self):
        with self.app.app_context():
            original_tag = self._add_tag("Original", "original")
            blog = self._add_blog(title="Tagged Draft", slug="tagged-draft")
            blog.tags = [original_tag]
            db.session.commit()
            blog_id = blog.id

        response = self.client.patch(
            "/blogs/tagged-draft",
            headers=self._auth_headers(),
            json={"tags": [""]},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json()["error"]["fields"]["tags"],
            "Tags cannot include blank names.",
        )

        with self.app.app_context():
            unchanged_blog = db.session.get(Blog, blog_id)
            self.assertEqual([tag.slug for tag in unchanged_blog.tags], ["original"])

    def test_update_blog_retries_late_duplicate_slug_collision(self):
        with self.app.app_context():
            self._add_blog(title="Taken Race", slug="race-title")
            blog = self._add_blog(
                title="Original Race",
                slug="original-race",
                content="Original content",
            )
            blog_id = blog.id

        real_unique_slug = blog_routes._unique_slug
        calls = 0

        def colliding_slug(title, exclude_blog_id=None, rejected_slugs=None):
            nonlocal calls
            calls += 1
            if calls == 1:
                return "race-title"

            return real_unique_slug(
                title,
                exclude_blog_id=exclude_blog_id,
                rejected_slugs=rejected_slugs,
            )

        with patch.object(blog_routes, "_unique_slug", side_effect=colliding_slug):
            response = self.client.patch(
                "/blogs/original-race",
                headers=self._auth_headers(),
                json={"title": "Race Title", "content": "Updated content"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["blog"]["slug"], "race-title-2")
        self.assertEqual(response.get_json()["blog"]["content"], "Updated content")

        with self.app.app_context():
            updated_blog = db.session.get(Blog, blog_id)
            self.assertEqual(updated_blog.slug, "race-title-2")
            self.assertEqual(updated_blog.content, "Updated content")

    def test_update_blog_requires_valid_bearer_token(self):
        response = self.client.patch(
            "/blogs/missing-auth",
            json={"title": "Updated"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "A valid bearer token is required.",
                }
            },
        )

    def test_update_blog_rejects_non_author(self):
        with self.app.app_context():
            self._add_blog(title="Private Draft", slug="private-draft")

        response = self.client.patch(
            "/blogs/private-draft",
            headers=self._auth_headers(self.other_user_id),
            json={"content": "Attempted update."},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only the blog author can update this blog.",
                }
            },
        )

    def test_update_blog_rejects_invalid_optional_fields(self):
        with self.app.app_context():
            self._add_blog(title="Original Title", slug="original-title")

        response = self.client.patch(
            "/blogs/original-title",
            headers=self._auth_headers(),
            json={
                "title": "",
                "excerpt": 123,
                "content": "",
                "status": "archived",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid blog request.",
                    "fields": {
                        "title": "Title cannot be blank.",
                        "excerpt": "Excerpt must be a string.",
                        "content": "Content cannot be blank.",
                        "status": "Status must be draft or published.",
                    },
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
