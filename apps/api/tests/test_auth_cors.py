import unittest

from app import create_app


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


class AuthCorsTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def _auth_preflight(self, origin):
        return self.client.options(
            "/auth/login",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization, Content-Type",
            },
        )

    def test_auth_preflight_allows_localhost_frontend_with_credentials(self):
        response = self._auth_preflight("http://localhost:3000")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://localhost:3000",
        )
        self.assertEqual(response.headers["Access-Control-Allow-Credentials"], "true")
        self.assertIn("Authorization", response.headers["Access-Control-Allow-Headers"])
        self.assertIn("Content-Type", response.headers["Access-Control-Allow-Headers"])
        self.assertIn("POST", response.headers["Access-Control-Allow-Methods"])

    def test_auth_preflight_allows_loopback_frontend_with_credentials(self):
        response = self._auth_preflight("http://127.0.0.1:3000")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["Access-Control-Allow-Origin"],
            "http://127.0.0.1:3000",
        )
        self.assertEqual(response.headers["Access-Control-Allow-Credentials"], "true")

    def test_auth_response_does_not_allow_unconfigured_origin(self):
        response = self.client.get(
            "/auth/me",
            headers={"Origin": "http://localhost:4000"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)


if __name__ == "__main__":
    unittest.main()
