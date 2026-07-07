import unittest

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class LoginEndpointTestCase(unittest.TestCase):
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

    def test_login_returns_public_user_for_valid_credentials(self):
        response = self.client.post(
            "/auth/login",
            json={
                "email": " ADA@example.com ",
                "password": "correct-horse-battery",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "user": {
                    "id": 1,
                    "name": "Ada Lovelace",
                    "email": "ada@example.com",
                }
            },
        )

    def test_login_rejects_invalid_fields(self):
        response = self.client.post(
            "/auth/login",
            json={"email": "not-an-email", "password": ""},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid login request.",
                    "fields": {
                        "email": "Enter a valid email address.",
                        "password": "Password is required.",
                    },
                }
            },
        )

    def test_login_rejects_unknown_email_with_invalid_credentials_error(self):
        response = self.client.post(
            "/auth/login",
            json={
                "email": "unknown@example.com",
                "password": "correct-horse-battery",
            },
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password.",
                }
            },
        )

    def test_login_rejects_wrong_password_with_invalid_credentials_error(self):
        response = self.client.post(
            "/auth/login",
            json={
                "email": "ada@example.com",
                "password": "wrong-password",
            },
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password.",
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
