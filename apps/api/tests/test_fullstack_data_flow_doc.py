from pathlib import Path
import unittest


REPO_ROOT = Path(__file__).resolve().parents[3]
DOC_PATH = REPO_ROOT / "docs" / "fullstack-data-flow.md"


class FullStackDataFlowDocTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = DOC_PATH.read_text(encoding="utf-8")

    def test_backend_route_groups_are_mapped(self):
        for endpoint in (
            "POST /auth/register",
            "POST /auth/login",
            "POST /auth/refresh",
            "POST /auth/logout",
            "GET /auth/me",
            "GET /blogs",
            "GET /blogs/<slug>",
            "GET /blogs/<slug>/mine",
            "POST /blogs",
            "PATCH /blogs/<slug>",
            "DELETE /blogs/<slug>",
            "GET /blogs/<slug>/comments",
            "POST /blogs/<slug>/comments",
            "PATCH /comments/<comment_id>",
            "DELETE /comments/<comment_id>",
            "GET /health",
        ):
            with self.subTest(endpoint=endpoint):
                self.assertIn(endpoint, self.doc)

    def test_database_tables_and_access_paths_are_mapped(self):
        for token in (
            "users",
            "blogs",
            "comments",
            "users.email",
            "blogs.slug",
            "blogs(status, created_at, id)",
            "blogs(author_id, created_at, id)",
            "comments(blog_id, created_at, id)",
            "comments.blog_id -> blogs.id",
        ):
            with self.subTest(token=token):
                self.assertIn(token, self.doc)

    def test_important_backend_error_and_auth_contracts_are_mapped(self):
        for token in (
            "VALIDATION_ERROR",
            "UNAUTHORIZED",
            "FORBIDDEN",
            "BLOG_NOT_FOUND",
            "COMMENT_NOT_FOUND",
            "BLOG_SLUG_CONFLICT",
            "Authorization: Bearer <accessToken>",
            "refreshToken",
        ):
            with self.subTest(token=token):
                self.assertIn(token, self.doc)


if __name__ == "__main__":
    unittest.main()
