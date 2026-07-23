import unittest

from app import create_app
from app.config import normalize_database_url


class DatabaseUrlConfigTest(unittest.TestCase):
    def test_mysql_url_is_normalized_to_pymysql_driver(self):
        url = "mysql://railway_user:secret@roundhouse.proxy.rlwy.net:12345/railway"

        normalized = normalize_database_url(url)

        self.assertEqual(
            normalized,
            "mysql+pymysql://railway_user:secret@roundhouse.proxy.rlwy.net:12345/railway",
        )

    def test_mysql_pymysql_url_passes_through_unchanged(self):
        url = "mysql+pymysql://miniblog:secret@127.0.0.1:3307/miniblog"

        normalized = normalize_database_url(url)

        self.assertEqual(normalized, url)

    def test_normalization_only_replaces_the_url_scheme(self):
        url = "mysql://user:secret@db.internal:7123/customdb?note=mysql://keep"

        normalized = normalize_database_url(url)

        self.assertEqual(
            normalized,
            "mysql+pymysql://user:secret@db.internal:7123/customdb?note=mysql://keep",
        )

    def test_app_config_does_not_assume_database_host_port_or_name(self):
        class TestConfig:
            TESTING = True
            SQLALCHEMY_DATABASE_URI = (
                "mysql://railway_user:secret@containers.example.net:6543/appdb"
            )
            JWT_SECRET_KEY = "test-jwt-secret"

        app = create_app(TestConfig)

        self.assertEqual(
            app.config["SQLALCHEMY_DATABASE_URI"],
            "mysql+pymysql://railway_user:secret@containers.example.net:6543/appdb",
        )

    def test_testing_sqlite_database_uri_remains_usable(self):
        class TestConfig:
            TESTING = True
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            JWT_SECRET_KEY = "test-jwt-secret"

        app = create_app(TestConfig)

        self.assertEqual(app.config["SQLALCHEMY_DATABASE_URI"], "sqlite:///:memory:")


class ProductionJwtSecretValidationTest(unittest.TestCase):
    def test_production_rejects_empty_jwt_secret(self):
        class TestConfig:
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            JWT_SECRET_KEY = ""

        with self.assertRaisesRegex(RuntimeError, "JWT_SECRET_KEY"):
            create_app(TestConfig)

    def test_production_rejects_placeholder_jwt_secret(self):
        class TestConfig:
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            JWT_SECRET_KEY = "replace-with-a-long-random-local-secret"

        with self.assertRaisesRegex(RuntimeError, "JWT_SECRET_KEY"):
            create_app(TestConfig)

    def test_production_allows_strong_jwt_secret(self):
        class TestConfig:
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            JWT_SECRET_KEY = "a-local-test-value-that-is-long-enough"

        app = create_app(TestConfig)

        self.assertFalse(app.config["TESTING"])

    def test_local_development_allows_documented_placeholder(self):
        class TestConfig:
            MINIBLOG_ENV = "development"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            JWT_SECRET_KEY = "replace-with-a-long-random-local-secret"

        app = create_app(TestConfig)

        self.assertFalse(app.config["TESTING"])

    def test_testing_allows_documented_test_secret(self):
        class TestConfig:
            TESTING = True
            MINIBLOG_ENV = "production"
            SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
            JWT_SECRET_KEY = "test-jwt-secret"

        app = create_app(TestConfig)

        self.assertTrue(app.config["TESTING"])


if __name__ == "__main__":
    unittest.main()
