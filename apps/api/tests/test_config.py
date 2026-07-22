import unittest

from app import create_app


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
