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


class CurrentUserEndpointTestCase(unittest.TestCase):
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

    def _access_token(
        self,
        user_id="1",
        expires_delta=timedelta(minutes=15),
        secret=TestConfig.JWT_SECRET_KEY,
    ):
        now = datetime.now(timezone.utc)
        return jwt.encode(
            {
                "sub": str(user_id),
                "iat": now,
                "exp": now + expires_delta,
            },
            secret,
            algorithm="HS256",
        )

    def _assert_authentication_error(self, response):
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

    def test_me_returns_current_user_for_valid_bearer_token(self):
        response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {self._access_token()}"},
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

    def test_me_rejects_missing_authorization_header(self):
        response = self.client.get("/auth/me")

        self._assert_authentication_error(response)

    def test_me_rejects_malformed_authorization_header(self):
        response = self.client.get(
            "/auth/me",
            headers={"Authorization": "Token not-a-bearer-token"},
        )

        self._assert_authentication_error(response)

    def test_me_rejects_invalid_access_token(self):
        response = self.client.get(
            "/auth/me",
            headers={
                "Authorization": f"Bearer {self._access_token(secret='wrong-secret')}"
            },
        )

        self._assert_authentication_error(response)

    def test_me_rejects_expired_access_token(self):
        expired_token = self._access_token(expires_delta=timedelta(seconds=-1))

        response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )

        self._assert_authentication_error(response)

    def test_me_rejects_token_for_unknown_user(self):
        response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {self._access_token(user_id='999')}"},
        )

        self._assert_authentication_error(response)


if __name__ == "__main__":
    unittest.main()
