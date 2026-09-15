import unittest

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
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


class DatabaseHardeningTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)

        with self.app.app_context():
            db.session.execute(text("PRAGMA foreign_keys=ON"))
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_model_metadata_exposes_query_pattern_indexes(self):
        blog_indexes = {
            index.name: [column.name for column in index.columns]
            for index in Blog.__table__.indexes
        }
        comment_indexes = {
            index.name: [column.name for column in index.columns]
            for index in Comment.__table__.indexes
        }

        self.assertEqual(
            blog_indexes["ix_blogs_status_created_at_id"],
            ["status", "created_at", "id"],
        )
        self.assertEqual(
            blog_indexes["ix_blogs_author_id_created_at_id"],
            ["author_id", "created_at", "id"],
        )
        self.assertEqual(
            comment_indexes["ix_comments_blog_id_created_at_id"],
            ["blog_id", "created_at", "id"],
        )

    def test_model_metadata_exposes_foreign_key_delete_behavior(self):
        blog_author_fk = next(iter(Blog.__table__.c.author_id.foreign_keys))
        comment_author_fk = next(iter(Comment.__table__.c.author_id.foreign_keys))
        comment_blog_fk = next(iter(Comment.__table__.c.blog_id.foreign_keys))

        self.assertEqual(blog_author_fk.ondelete, "RESTRICT")
        self.assertEqual(comment_author_fk.ondelete, "RESTRICT")
        self.assertEqual(comment_blog_fk.ondelete, "CASCADE")

    def test_database_cascades_comments_when_blog_is_deleted_directly(self):
        with self.app.app_context():
            user = User(
                name="Ada Lovelace",
                email="ada@example.com",
                password_hash=generate_password_hash("correct-horse-battery"),
            )
            db.session.add(user)
            db.session.commit()

            blog = Blog(
                title="Delete Directly",
                slug="delete-directly",
                content="Blog content",
                author_id=user.id,
            )
            db.session.add(blog)
            db.session.commit()

            comment = Comment(
                content="Comment content",
                author_id=user.id,
                blog_id=blog.id,
            )
            db.session.add(comment)
            db.session.commit()
            blog_id = blog.id
            comment_id = comment.id

            db.session.execute(
                text("DELETE FROM blogs WHERE id = :id"),
                {"id": blog_id},
            )
            db.session.commit()

            self.assertIsNone(db.session.get(Blog, blog_id))
            self.assertIsNone(db.session.get(Comment, comment_id))

    def test_database_restricts_user_delete_when_content_exists(self):
        with self.app.app_context():
            user = User(
                name="Ada Lovelace",
                email="ada@example.com",
                password_hash=generate_password_hash("correct-horse-battery"),
            )
            db.session.add(user)
            db.session.commit()

            blog = Blog(
                title="Authored Blog",
                slug="authored-blog",
                content="Blog content",
                author_id=user.id,
            )
            db.session.add(blog)
            db.session.commit()

            with self.assertRaises(IntegrityError):
                db.session.execute(
                    text("DELETE FROM users WHERE id = :id"),
                    {"id": user.id},
                )
                db.session.commit()

            db.session.rollback()
            self.assertIsNotNone(db.session.get(User, user.id))
            self.assertIsNotNone(db.session.get(Blog, blog.id))


if __name__ == "__main__":
    unittest.main()
