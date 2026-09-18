import tempfile
import unittest
from pathlib import Path

import sqlalchemy as sa

from app import create_app
from app.schema_readiness import (
    REQUIRED_SCHEMA_TABLES,
    is_flask_db_command,
    missing_required_schema_tables,
    should_check_schema_readiness,
    verify_required_schema_tables,
)


def _create_sqlite_database_with_tables(table_names: set[str]) -> str:
    directory = tempfile.TemporaryDirectory()
    db_path = Path(directory.name) / "schema-readiness.sqlite"
    uri = f"sqlite:///{db_path}"
    engine = sa.create_engine(uri)

    with engine.begin() as connection:
        for table_name in sorted(table_names):
            connection.exec_driver_sql(
                f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY)"
            )

    engine.dispose()

    # Keep the temp directory alive for the lifetime of this test process.
    _TEMP_DIRECTORIES.append(directory)
    return uri


_TEMP_DIRECTORIES: list[tempfile.TemporaryDirectory] = []


class SchemaReadinessHelperTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = sa.create_engine("sqlite:///:memory:")

    def tearDown(self):
        self.engine.dispose()

    def _create_tables(self, table_names: set[str]) -> None:
        with self.engine.begin() as connection:
            for table_name in sorted(table_names):
                connection.exec_driver_sql(
                    f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY)"
                )

    def test_verify_required_schema_tables_allows_ready_schema(self):
        self._create_tables(set(REQUIRED_SCHEMA_TABLES))

        verify_required_schema_tables(self.engine)

        self.assertEqual(missing_required_schema_tables(self.engine), [])

    def test_verify_required_schema_tables_reports_missing_blog_tags(self):
        self._create_tables(set(REQUIRED_SCHEMA_TABLES) - {"blog_tags"})

        with self.assertRaisesRegex(RuntimeError, "blog_tags"):
            verify_required_schema_tables(self.engine)

        inspector = sa.inspect(self.engine)
        self.assertNotIn("blog_tags", inspector.get_table_names())

    def test_verify_required_schema_tables_reports_missing_tags(self):
        self._create_tables(set(REQUIRED_SCHEMA_TABLES) - {"tags"})

        with self.assertRaisesRegex(RuntimeError, "tags"):
            verify_required_schema_tables(self.engine)

        inspector = sa.inspect(self.engine)
        self.assertNotIn("tags", inspector.get_table_names())


class SchemaReadinessStartupTestCase(unittest.TestCase):
    def test_production_startup_fails_when_required_tables_are_missing(self):
        class TestConfig:
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            SQLALCHEMY_TRACK_MODIFICATIONS = False
            JWT_SECRET_KEY = "a-local-test-value-that-is-long-enough"

        with self.assertRaisesRegex(RuntimeError, "blog_tags"):
            create_app(TestConfig)

    def test_production_startup_allows_ready_schema(self):
        uri = _create_sqlite_database_with_tables(set(REQUIRED_SCHEMA_TABLES))

        class TestConfig:
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = uri
            SQLALCHEMY_TRACK_MODIFICATIONS = False
            JWT_SECRET_KEY = "a-local-test-value-that-is-long-enough"

        app = create_app(TestConfig)

        self.assertFalse(app.config["TESTING"])

    def test_testing_mode_bypasses_schema_readiness(self):
        class TestConfig:
            TESTING = True
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            SQLALCHEMY_TRACK_MODIFICATIONS = False
            JWT_SECRET_KEY = "test-jwt-secret"

        app = create_app(TestConfig)

        self.assertTrue(app.config["TESTING"])

    def test_schema_readiness_skips_flask_migration_commands(self):
        config = {
            "MINIBLOG_ENV": "production",
            "TESTING": False,
        }

        self.assertTrue(should_check_schema_readiness(config, argv=["gunicorn"]))
        self.assertFalse(
            should_check_schema_readiness(
                config,
                argv=["flask", "--app", "app", "db", "upgrade"],
            )
        )
        self.assertTrue(
            is_flask_db_command(["flask", "--app", "app", "db", "upgrade"])
        )


if __name__ == "__main__":
    unittest.main()
