from datetime import datetime, timedelta, timezone
import unittest

import jwt
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.blog import Blog
from app.models.user import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = 900


class ReadBlogEndpointTestCase(unittest.TestCase):
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
            db.session.add(author)
            other_user = User(
                name="Grace Hopper",
                email="grace@example.com",
                password_hash=generate_password_hash("correct-horse-battery"),
            )
            db.session.add(other_user)
            db.session.commit()
            self.author_id = author.id
            self.other_user_id = other_user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _add_blog(
        self,
        title,
        slug,
        status=Blog.STATUS_PUBLISHED,
        excerpt=None,
        content="Blog content",
        author_id=None,
        created_at=None,
    ):
        blog = Blog(
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            status=status,
            author_id=author_id or self.author_id,
        )
        if created_at is not None:
            blog.created_at = created_at
            blog.updated_at = created_at

        db.session.add(blog)
        db.session.commit()
        return blog

    def _access_token(self, user_id=None):
        now = datetime.now(timezone.utc)
        return jwt.encode(
            {
                "sub": str(user_id or self.author_id),
                "iat": now,
                "exp": now + timedelta(minutes=15),
            },
            TestConfig.JWT_SECRET_KEY,
            algorithm="HS256",
        )

    def _auth_headers(self, user_id=None):
        return {"Authorization": f"Bearer {self._access_token(user_id)}"}

    def test_list_blogs_returns_published_blogs_with_author_and_pagination(self):
        with self.app.app_context():
            draft = self._add_blog(
                title="Draft Post",
                slug="draft-post",
                status=Blog.STATUS_DRAFT,
            )
            first = self._add_blog(
                title="First Published",
                slug="first-published",
                excerpt="First summary",
            )
            second = self._add_blog(
                title="Second Published",
                slug="second-published",
                excerpt="Second summary",
            )
            draft_id = draft.id
            second_id = second.id

        response = self.client.get("/blogs?page=1&perPage=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["pagination"],
            {
                "page": 1,
                "perPage": 1,
                "total": 2,
                "totalPages": 2,
            },
        )
        self.assertEqual(len(response.get_json()["blogs"]), 1)
        self.assertEqual(response.get_json()["blogs"][0]["id"], second_id)
        self.assertEqual(response.get_json()["blogs"][0]["slug"], "second-published")
        self.assertEqual(
            response.get_json()["blogs"][0]["author"],
            {"id": 1, "name": "Ada Lovelace"},
        )
        self.assertNotEqual(response.get_json()["blogs"][0]["id"], draft_id)

    def test_detail_returns_published_blog_by_slug_with_author(self):
        with self.app.app_context():
            blog = self._add_blog(
                title="Published Detail",
                slug="published-detail",
                excerpt="Detail summary",
                content="Full published content.",
            )
            blog_id = blog.id

        response = self.client.get("/blogs/published-detail")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {
                "id": response.get_json()["blog"]["id"],
                "title": response.get_json()["blog"]["title"],
                "slug": response.get_json()["blog"]["slug"],
                "excerpt": response.get_json()["blog"]["excerpt"],
                "content": response.get_json()["blog"]["content"],
                "status": response.get_json()["blog"]["status"],
                "author": response.get_json()["blog"]["author"],
            },
            {
                "id": blog_id,
                "title": "Published Detail",
                "slug": "published-detail",
                "excerpt": "Detail summary",
                "content": "Full published content.",
                "status": "published",
                "author": {"id": 1, "name": "Ada Lovelace"},
            },
        )

    def test_detail_does_not_return_draft_blog(self):
        with self.app.app_context():
            self._add_blog(
                title="Draft Detail",
                slug="draft-detail",
                status=Blog.STATUS_DRAFT,
            )

        response = self.client.get("/blogs/draft-detail")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "BLOG_NOT_FOUND",
                    "message": "Blog was not found.",
                }
            },
        )

    def test_private_detail_returns_draft_blog_for_author(self):
        with self.app.app_context():
            blog = self._add_blog(
                title="Draft Detail",
                slug="draft-detail",
                status=Blog.STATUS_DRAFT,
                excerpt="Draft summary",
                content="Private draft content.",
            )
            blog_id = blog.id

        response = self.client.get(
            "/blogs/draft-detail/mine",
            headers=self._auth_headers(),
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
                "title": "Draft Detail",
                "slug": "draft-detail",
                "excerpt": "Draft summary",
                "content": "Private draft content.",
                "status": "draft",
                "authorId": self.author_id,
            },
        )

    def test_private_detail_requires_valid_bearer_token(self):
        response = self.client.get("/blogs/draft-detail/mine")

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

    def test_private_detail_rejects_non_author(self):
        with self.app.app_context():
            self._add_blog(
                title="Other Draft",
                slug="other-draft",
                status=Blog.STATUS_DRAFT,
            )

        response = self.client.get(
            "/blogs/other-draft/mine",
            headers=self._auth_headers(self.other_user_id),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only the blog author can view this blog.",
                }
            },
        )

    def test_private_detail_returns_not_found_for_missing_blog(self):
        response = self.client.get(
            "/blogs/missing-blog/mine",
            headers=self._auth_headers(),
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "BLOG_NOT_FOUND",
                    "message": "Blog was not found.",
                }
            },
        )

    def test_my_blogs_requires_valid_bearer_token(self):
        response = self.client.get("/me/blogs")

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

    def test_my_blogs_returns_owned_draft_and_published_blogs(self):
        with self.app.app_context():
            self._add_blog(
                title="Owned Draft",
                slug="owned-draft",
                status=Blog.STATUS_DRAFT,
            )
            self._add_blog(
                title="Owned Published",
                slug="owned-published",
                status=Blog.STATUS_PUBLISHED,
            )

        response = self.client.get("/me/blogs", headers=self._auth_headers())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {blog["slug"]: blog["status"] for blog in response.get_json()["blogs"]},
            {
                "owned-draft": "draft",
                "owned-published": "published",
            },
        )
        self.assertEqual(
            {blog["author"]["id"] for blog in response.get_json()["blogs"]},
            {self.author_id},
        )

    def test_my_blogs_excludes_other_users_blogs(self):
        with self.app.app_context():
            self._add_blog(title="Owned Blog", slug="owned-blog")
            self._add_blog(
                title="Other User Blog",
                slug="other-user-blog",
                author_id=self.other_user_id,
            )

        response = self.client.get("/me/blogs", headers=self._auth_headers())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [blog["slug"] for blog in response.get_json()["blogs"]],
            ["owned-blog"],
        )

    def test_my_blogs_returns_pagination_metadata(self):
        with self.app.app_context():
            for index in range(3):
                self._add_blog(title=f"Owned Blog {index}", slug=f"owned-blog-{index}")

        response = self.client.get(
            "/me/blogs?page=2&perPage=2",
            headers=self._auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["pagination"],
            {
                "page": 2,
                "perPage": 2,
                "total": 3,
                "totalPages": 2,
            },
        )
        self.assertEqual(len(response.get_json()["blogs"]), 1)

    def test_my_blogs_sorts_newest_first(self):
        now = datetime.now(timezone.utc)
        with self.app.app_context():
            self._add_blog(
                title="Old Blog",
                slug="old-blog",
                created_at=now - timedelta(days=1),
            )
            self._add_blog(
                title="New Blog",
                slug="new-blog",
                created_at=now,
            )

        response = self.client.get("/me/blogs", headers=self._auth_headers())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [blog["slug"] for blog in response.get_json()["blogs"]],
            ["new-blog", "old-blog"],
        )

    def test_public_list_remains_published_only_after_my_blogs_endpoint(self):
        with self.app.app_context():
            self._add_blog(
                title="Public Draft",
                slug="public-draft",
                status=Blog.STATUS_DRAFT,
            )
            self._add_blog(
                title="Public Published",
                slug="public-published",
                status=Blog.STATUS_PUBLISHED,
            )

        response = self.client.get("/blogs")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [blog["slug"] for blog in response.get_json()["blogs"]],
            ["public-published"],
        )


if __name__ == "__main__":
    unittest.main()
