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


class CreateBlogEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            db.session.add(
                User(
                    name="Ada Lovelace",
                    email="ada@example.com",
                    password_hash=generate_password_hash("correct-horse-battery"),
                )
            )
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _access_token(self, user_id="1"):
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

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self._access_token()}"}

    def test_create_blog_creates_published_blog_for_current_user(self):
        response = self.client.post(
            "/blogs",
            headers=self._auth_headers(),
            json={
                "title": " My First Post! ",
                "excerpt": " A short summary. ",
                "content": " Hello from MiniBlog. ",
                "status": "published",
            },
        )

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(
            {
                "title": body["blog"]["title"],
                "slug": body["blog"]["slug"],
                "excerpt": body["blog"]["excerpt"],
                "content": body["blog"]["content"],
                "status": body["blog"]["status"],
                "authorId": body["blog"]["authorId"],
            },
            {
                "title": "My First Post!",
                "slug": "my-first-post",
                "excerpt": "A short summary.",
                "content": "Hello from MiniBlog.",
                "status": "published",
                "authorId": 1,
            },
        )
        self.assertIsInstance(body["blog"]["id"], int)
        self.assertIsInstance(body["blog"]["createdAt"], str)
        self.assertIsInstance(body["blog"]["updatedAt"], str)

        with self.app.app_context():
            blog = Blog.query.one()
            self.assertEqual(blog.author_id, 1)
            self.assertEqual(blog.slug, "my-first-post")

    def test_create_blog_defaults_to_draft_and_generates_unique_slug(self):
        with self.app.app_context():
            db.session.add(
                Blog(
                    title="Existing",
                    slug="same-title",
                    content="Existing content",
                    author_id=1,
                )
            )
            db.session.commit()

        response = self.client.post(
            "/blogs",
            headers=self._auth_headers(),
            json={"title": "Same Title", "content": "New content"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["blog"]["slug"], "same-title-2")
        self.assertEqual(response.get_json()["blog"]["status"], "draft")
        self.assertIsNone(response.get_json()["blog"]["excerpt"])

    def test_create_blog_requires_valid_bearer_token(self):
        response = self.client.post(
            "/blogs",
            json={"title": "Private Post", "content": "Only authors can post."},
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

    def test_create_blog_rejects_invalid_fields(self):
        response = self.client.post(
            "/blogs",
            headers=self._auth_headers(),
            json={"title": "", "content": "", "status": "archived"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid blog request.",
                    "fields": {
                        "title": "Title is required.",
                        "content": "Content is required.",
                        "status": "Status must be draft or published.",
                    },
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
