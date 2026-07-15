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


class CommentEndpointTestCase(unittest.TestCase):
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
            commenter = User(
                name="Grace Hopper",
                email="grace@example.com",
                password_hash=generate_password_hash("correct-horse-battery"),
            )
            db.session.add_all([author, commenter])
            db.session.commit()
            self.author_id = author.id
            self.commenter_id = commenter.id

            blog = Blog(
                title="Published Post",
                slug="published-post",
                content="Published content",
                status=Blog.STATUS_PUBLISHED,
                author_id=self.author_id,
            )
            other_blog = Blog(
                title="Other Post",
                slug="other-post",
                content="Other content",
                status=Blog.STATUS_PUBLISHED,
                author_id=self.author_id,
            )
            draft_blog = Blog(
                title="Draft Post",
                slug="draft-post",
                content="Draft content",
                status=Blog.STATUS_DRAFT,
                author_id=self.author_id,
            )
            db.session.add_all([blog, other_blog, draft_blog])
            db.session.commit()
            self.blog_id = blog.id
            self.other_blog_id = other_blog.id

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
                "sub": str(user_id or self.commenter_id),
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

    def test_create_comment_adds_comment_for_authenticated_user(self):
        response = self.client.post(
            "/blogs/published-post/comments",
            headers=self._auth_headers(),
            json={"content": "  Great post.  "},
        )

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(
            {
                "content": body["comment"]["content"],
                "authorId": body["comment"]["authorId"],
                "blogId": body["comment"]["blogId"],
                "author": body["comment"]["author"],
            },
            {
                "content": "Great post.",
                "authorId": self.commenter_id,
                "blogId": self.blog_id,
                "author": {"id": self.commenter_id, "name": "Grace Hopper"},
            },
        )
        self.assertIsInstance(body["comment"]["id"], int)
        self.assertIsInstance(body["comment"]["createdAt"], str)
        self.assertIsInstance(body["comment"]["updatedAt"], str)

        with self.app.app_context():
            comment = Comment.query.one()
            self.assertEqual(comment.author_id, self.commenter_id)
            self.assertEqual(comment.blog_id, self.blog_id)
            self.assertEqual(comment.content, "Great post.")

    def test_create_comment_requires_valid_bearer_token(self):
        response = self.client.post(
            "/blogs/published-post/comments",
            json={"content": "Missing auth."},
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

    def test_create_comment_rejects_invalid_content(self):
        response = self.client.post(
            "/blogs/published-post/comments",
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
                    "fields": {"content": "Content is required."},
                }
            },
        )

    def test_create_comment_returns_not_found_for_missing_or_draft_blog(self):
        missing_response = self.client.post(
            "/blogs/missing/comments",
            headers=self._auth_headers(),
            json={"content": "Missing blog."},
        )
        draft_response = self.client.post(
            "/blogs/draft-post/comments",
            headers=self._auth_headers(),
            json={"content": "Draft blog."},
        )

        self.assertEqual(missing_response.status_code, 404)
        self.assertEqual(draft_response.status_code, 404)
        self.assertEqual(missing_response.get_json(), draft_response.get_json())

    def test_list_comments_returns_comments_for_blog_ordered_by_created_at(self):
        with self.app.app_context():
            db.session.add_all(
                [
                    Comment(
                        content="Second",
                        author_id=self.commenter_id,
                        blog_id=self.blog_id,
                        created_at=datetime(
                            2026, 7, 15, 10, 2, tzinfo=timezone.utc
                        ),
                    ),
                    Comment(
                        content="First",
                        author_id=self.author_id,
                        blog_id=self.blog_id,
                        created_at=datetime(
                            2026, 7, 15, 10, 1, tzinfo=timezone.utc
                        ),
                    ),
                    Comment(
                        content="Other blog",
                        author_id=self.commenter_id,
                        blog_id=self.other_blog_id,
                        created_at=datetime(
                            2026, 7, 15, 10, 0, tzinfo=timezone.utc
                        ),
                    ),
                ]
            )
            db.session.commit()

        response = self.client.get("/blogs/published-post/comments")

        self.assertEqual(response.status_code, 200)
        comments = response.get_json()["comments"]
        self.assertEqual(
            [comment["content"] for comment in comments],
            ["First", "Second"],
        )
        self.assertEqual(
            [comment["author"] for comment in comments],
            [
                {"id": self.author_id, "name": "Ada Lovelace"},
                {"id": self.commenter_id, "name": "Grace Hopper"},
            ],
        )

    def test_list_comments_returns_not_found_for_missing_or_draft_blog(self):
        missing_response = self.client.get("/blogs/missing/comments")
        draft_response = self.client.get("/blogs/draft-post/comments")

        self.assertEqual(missing_response.status_code, 404)
        self.assertEqual(draft_response.status_code, 404)
        self.assertEqual(
            missing_response.get_json(),
            {
                "error": {
                    "code": "BLOG_NOT_FOUND",
                    "message": "Blog was not found.",
                }
            },
        )
        self.assertEqual(draft_response.get_json(), missing_response.get_json())


if __name__ == "__main__":
    unittest.main()
