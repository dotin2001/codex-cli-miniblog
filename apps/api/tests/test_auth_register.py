import unittest

from werkzeug.security import check_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class RegisterEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post(
            "/auth/register",
            json={
                "name": " Ada Lovelace ",
                "email": "ADA@example.com",
                "password": "correct-horse-battery",
            },
        )

        self.assertEqual(response.status_code, 201)
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

        with self.app.app_context():
            user = User.query.filter_by(email="ada@example.com").one()
            self.assertNotEqual(user.password_hash, "correct-horse-battery")
            self.assertTrue(check_password_hash(user.password_hash, "correct-horse-battery"))

    def test_register_rejects_invalid_fields(self):
        response = self.client.post(
            "/auth/register",
            json={"name": "", "email": "not-an-email", "password": "short"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json(),
            {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid registration request.",
                    "fields": {
                        "name": "Name is required.",
                        "email": "Enter a valid email address.",
                        "password": "Password must be at least 8 characters.",
                    },
                }
            },
        )

    def test_register_rejects_duplicate_email(self):
        payload = {
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "correct-horse-battery",
        }
        first_response = self.client.post("/auth/register", json=payload)
        self.assertEqual(first_response.status_code, 201)

        duplicate_response = self.client.post("/auth/register", json=payload)

        self.assertEqual(duplicate_response.status_code, 409)
        self.assertEqual(
            duplicate_response.get_json(),
            {
                "error": {
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "Email is already registered.",
                }
            },
        )


if __name__ == "__main__":
    unittest.main()
