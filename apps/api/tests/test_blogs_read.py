import unittest

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
            db.session.commit()
            self.author_id = author.id

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
    ):
        blog = Blog(
            title=title,
            slug=slug,
            excerpt=excerpt,
            content=content,
            status=status,
            author_id=self.author_id,
        )
        db.session.add(blog)
        db.session.commit()
        return blog

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


if __name__ == "__main__":
    unittest.main()
