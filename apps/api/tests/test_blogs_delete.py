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


class DeleteBlogEndpointTestCase(unittest.TestCase):
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

    def _access_token(self, user_id, secret=TestConfig.JWT_SECRET_KEY):
        now = datetime.now(timezone.utc)
        return jwt.encode(
            {
                "sub": str(user_id),
                "iat": now,
                "exp": now + timedelta(minutes=15),
            },
            secret,
            algorithm="HS256",
        )

    def _auth_headers(self, user_id=None, secret=TestConfig.JWT_SECRET_KEY):
        return {
            "Authorization": (
                f"Bearer {self._access_token(user_id or self.author_id, secret)}"
            )
        }

    def _add_blog(self, title, slug, author_id=None):
        blog = Blog(
            title=title,
            slug=slug,
            content="Blog content",
            author_id=author_id or self.author_id,
        )
        db.session.add(blog)
        db.session.commit()
        return blog

    def test_delete_blog_removes_blog_for_author(self):
        with self.app.app_context():
            blog = self._add_blog(title="Delete Me", slug="delete-me")
            blog_id = blog.id

        response = self.client.delete(
            "/blogs/delete-me",
            headers=self._auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"message": "Blog deleted."})

        with self.app.app_context():
            self.assertIsNone(db.session.get(Blog, blog_id))

    def test_delete_blog_requires_bearer_token(self):
        response = self.client.delete("/blogs/missing-auth")

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

    def test_delete_blog_rejects_invalid_bearer_token(self):
        response = self.client.delete(
            "/blogs/invalid-token",
            headers=self._auth_headers(secret="wrong-secret"),
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

    def test_delete_blog_returns_not_found_for_missing_blog(self):
        response = self.client.delete(
            "/blogs/not-found",
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

    def test_delete_blog_rejects_non_author(self):
        with self.app.app_context():
            self._add_blog(title="Private Draft", slug="private-draft")

        response = self.client.delete(
            "/blogs/private-draft",
            headers=self._auth_headers(self.other_user_id),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only the blog author can delete this blog.",
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
