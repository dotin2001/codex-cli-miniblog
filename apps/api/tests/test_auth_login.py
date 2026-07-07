import unittest

import jwt
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = 900
    JWT_REFRESH_TOKEN_EXPIRES_SECONDS = 604800
    REFRESH_TOKEN_COOKIE_NAME = "refreshToken"
    REFRESH_TOKEN_COOKIE_SECURE = False
    REFRESH_TOKEN_COOKIE_SAMESITE = "Lax"


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

    def test_login_returns_access_token_and_public_user_for_valid_credentials(self):
        response = self.client.post(
            "/auth/login",
            json={
                "email": " ADA@example.com ",
                "password": "correct-horse-battery",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(
            body["user"],
            {
                "id": 1,
                "name": "Ada Lovelace",
                "email": "ada@example.com",
            },
        )
        self.assertIsInstance(body["accessToken"], str)

        payload = jwt.decode(
            body["accessToken"],
            TestConfig.JWT_SECRET_KEY,
            algorithms=["HS256"],
        )
        self.assertEqual(payload["sub"], "1")
        self.assertEqual(payload["user"], body["user"])
        self.assertIn("iat", payload)
        self.assertIn("exp", payload)
        self.assertEqual(payload["exp"] - payload["iat"], 900)

        refresh_cookie = self.client.get_cookie("refreshToken", path="/auth")
        self.assertIsNotNone(refresh_cookie)
        self.assertTrue(refresh_cookie.http_only)
        self.assertFalse(refresh_cookie.secure)
        self.assertEqual(refresh_cookie.same_site, "Lax")
        self.assertEqual(refresh_cookie.path, "/auth")

        refresh_payload = jwt.decode(
            refresh_cookie.value,
            TestConfig.JWT_SECRET_KEY,
            algorithms=["HS256"],
        )
        self.assertEqual(refresh_payload["sub"], "1")
        self.assertEqual(refresh_payload["typ"], "refresh")
        self.assertEqual(
            refresh_payload["exp"] - refresh_payload["iat"],
            TestConfig.JWT_REFRESH_TOKEN_EXPIRES_SECONDS,
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
