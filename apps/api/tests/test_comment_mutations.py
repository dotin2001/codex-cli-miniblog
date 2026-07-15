from datetime import datetime, timedelta, timezone
import unittest

import jwt
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.blog import Blog
from app.models.comment import Comment
from app.models.user import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = 900


class CommentMutationEndpointTestCase(unittest.TestCase):
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

            blog = Blog(
                title="Published Post",
                slug="published-post",
                content="Published content",
                status=Blog.STATUS_PUBLISHED,
                author_id=self.author_id,
            )
            db.session.add(blog)
            db.session.commit()
            self.blog_id = blog.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _access_token(
        self,
        user_id=None,
        expires_delta=timedelta(minutes=15),
        secret=TestConfig.JWT_SECRET_KEY,
    ):
        now = datetime.now(timezone.utc)
        return jwt.encode(
            {
                "sub": str(user_id or self.author_id),
                "iat": now,
                "exp": now + expires_delta,
            },
            secret,
            algorithm="HS256",
        )

    def _auth_headers(self, user_id=None, secret=TestConfig.JWT_SECRET_KEY):
        return {
            "Authorization": f"Bearer {self._access_token(user_id, secret=secret)}"
        }

    def _add_comment(self, author_id=None, content="Original comment"):
        comment = Comment(
            content=content,
            author_id=author_id or self.author_id,
            blog_id=self.blog_id,
        )
        db.session.add(comment)
        db.session.commit()
        return comment

    def test_update_comment_updates_comment_for_author(self):
        with self.app.app_context():
            comment = self._add_comment()
            comment_id = comment.id

        response = self.client.patch(
            f"/comments/{comment_id}",
            headers=self._auth_headers(),
            json={"content": "  Updated comment.  "},
        )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(
            {
                "id": body["comment"]["id"],
                "content": body["comment"]["content"],
                "authorId": body["comment"]["authorId"],
                "blogId": body["comment"]["blogId"],
                "author": body["comment"]["author"],
            },
            {
                "id": comment_id,
                "content": "Updated comment.",
                "authorId": self.author_id,
                "blogId": self.blog_id,
                "author": {"id": self.author_id, "name": "Ada Lovelace"},
            },
        )
        self.assertIsInstance(body["comment"]["createdAt"], str)
        self.assertIsInstance(body["comment"]["updatedAt"], str)

        with self.app.app_context():
            self.assertEqual(
                db.session.get(Comment, comment_id).content,
                "Updated comment.",
            )

    def test_update_comment_rejects_missing_token(self):
        response = self.client.patch(
            "/comments/1",
            json={"content": "Updated comment."},
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

    def test_update_comment_rejects_invalid_token(self):
        response = self.client.patch(
            "/comments/1",
            headers=self._auth_headers(secret="wrong-secret"),
            json={"content": "Updated comment."},
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

    def test_update_comment_returns_not_found(self):
        response = self.client.patch(
            "/comments/999",
            headers=self._auth_headers(),
            json={"content": "Updated comment."},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "COMMENT_NOT_FOUND",
                    "message": "Comment was not found.",
                }
            },
        )

    def test_update_comment_rejects_empty_content(self):
        with self.app.app_context():
            comment = self._add_comment()
            comment_id = comment.id

        response = self.client.patch(
            f"/comments/{comment_id}",
            headers=self._auth_headers(),
            json={"content": "   "},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid comment request.",
                    "fields": {"content": "Content cannot be blank."},
                }
            },
        )

    def test_update_comment_rejects_non_author(self):
        with self.app.app_context():
            comment = self._add_comment()
            comment_id = comment.id

        response = self.client.patch(
            f"/comments/{comment_id}",
            headers=self._auth_headers(self.other_user_id),
            json={"content": "Updated comment."},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only the comment author can update this comment.",
                }
            },
        )

    def test_delete_comment_deletes_comment_for_author(self):
        with self.app.app_context():
            comment = self._add_comment()
            comment_id = comment.id

        response = self.client.delete(
            f"/comments/{comment_id}",
            headers=self._auth_headers(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"message": "Comment deleted."})

        with self.app.app_context():
            self.assertIsNone(db.session.get(Comment, comment_id))

    def test_delete_comment_rejects_missing_token(self):
        response = self.client.delete("/comments/1")

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

    def test_delete_comment_rejects_invalid_token(self):
        response = self.client.delete(
            "/comments/1",
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

    def test_delete_comment_returns_not_found(self):
        response = self.client.delete(
            "/comments/999",
            headers=self._auth_headers(),
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "COMMENT_NOT_FOUND",
                    "message": "Comment was not found.",
                }
            },
        )

    def test_delete_comment_rejects_non_author(self):
        with self.app.app_context():
            comment = self._add_comment()
            comment_id = comment.id

        response = self.client.delete(
            f"/comments/{comment_id}",
            headers=self._auth_headers(self.other_user_id),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Only the comment author can delete this comment.",
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
