from datetime import datetime, timedelta, timezone
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


class RefreshLogoutEndpointTestCase(unittest.TestCase):
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

    def _refresh_token(
        self,
        user_id="1",
        expires_delta=timedelta(days=7),
        token_type="refresh",
        secret=TestConfig.JWT_SECRET_KEY,
    ):
        now = datetime.now(timezone.utc)
        return jwt.encode(
            {
                "sub": str(user_id),
                "typ": token_type,
                "iat": now,
                "exp": now + expires_delta,
            },
            secret,
            algorithm="HS256",
        )

    def _set_refresh_cookie(self, token):
        self.client.set_cookie(
            TestConfig.REFRESH_TOKEN_COOKIE_NAME,
            token,
            path="/auth",
        )

    def _assert_refresh_error(self, response):
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "A valid refresh token is required.",
                }
            },
        )

    def test_refresh_returns_new_access_token_for_valid_refresh_cookie(self):
        self._set_refresh_cookie(self._refresh_token())

        response = self.client.post("/auth/refresh")

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertEqual(list(body.keys()), ["accessToken"])

        payload = jwt.decode(
            body["accessToken"],
            TestConfig.JWT_SECRET_KEY,
            algorithms=["HS256"],
        )
        self.assertEqual(payload["sub"], "1")
        self.assertEqual(
            payload["user"],
            {
                "id": 1,
                "name": "Ada Lovelace",
                "email": "ada@example.com",
            },
        )
        self.assertEqual(payload["exp"] - payload["iat"], 900)

    def test_refresh_rejects_missing_refresh_cookie(self):
        response = self.client.post("/auth/refresh")

        self._assert_refresh_error(response)

    def test_refresh_rejects_invalid_refresh_cookie(self):
        self._set_refresh_cookie(self._refresh_token(secret="wrong-secret"))

        response = self.client.post("/auth/refresh")

        self._assert_refresh_error(response)

    def test_refresh_rejects_expired_refresh_cookie(self):
        self._set_refresh_cookie(self._refresh_token(expires_delta=timedelta(seconds=-1)))

        response = self.client.post("/auth/refresh")

        self._assert_refresh_error(response)

    def test_refresh_rejects_non_refresh_token_type(self):
        self._set_refresh_cookie(self._refresh_token(token_type="access"))

        response = self.client.post("/auth/refresh")

        self._assert_refresh_error(response)

    def test_refresh_rejects_token_for_unknown_user(self):
        self._set_refresh_cookie(self._refresh_token(user_id="999"))

        response = self.client.post("/auth/refresh")

        self._assert_refresh_error(response)

    def test_logout_clears_refresh_cookie(self):
        self._set_refresh_cookie(self._refresh_token())

        response = self.client.post("/auth/logout")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"message": "Logged out."})
        self.assertIsNone(self.client.get_cookie(TestConfig.REFRESH_TOKEN_COOKIE_NAME))


if __name__ == "__main__":
    unittest.main()
