import json
from pathlib import Path
import unittest


REPO_ROOT = Path(__file__).resolve().parents[3]
API_ROOT = REPO_ROOT / "apps" / "api"


class DeploymentStartupTestCase(unittest.TestCase):
    def test_railway_uses_migration_startup_script(self):
        railway_config = json.loads(
            (REPO_ROOT / "railway.json").read_text(encoding="utf-8")
        )

        build_config = railway_config["build"]
        start_command = railway_config["deploy"]["startCommand"]

        self.assertEqual(build_config["builder"], "DOCKERFILE")
        self.assertEqual(build_config["dockerfilePath"], "Dockerfile")
        self.assertEqual(start_command, "sh ./start-api.sh")
        self.assertNotIn("gunicorn", start_command)

    def test_dockerfiles_use_migration_startup_entrypoint(self):
        expected_entrypoint = 'ENTRYPOINT ["sh", "./start-api.sh"]'

        for dockerfile in (REPO_ROOT / "Dockerfile", API_ROOT / "Dockerfile"):
            with self.subTest(dockerfile=dockerfile.relative_to(REPO_ROOT)):
                content = dockerfile.read_text(encoding="utf-8")

                self.assertIn(expected_entrypoint, content)
                self.assertNotIn('CMD ["sh", "./start-api.sh"]', content)
                self.assertNotIn("CMD gunicorn", content)

    def test_procfile_uses_migration_startup_script(self):
        procfile = (API_ROOT / "Procfile").read_text(encoding="utf-8").strip()

        self.assertEqual(procfile, "web: sh ./start-api.sh")

    def test_startup_script_runs_migrations_before_gunicorn(self):
        startup_script = (API_ROOT / "start-api.sh").read_text(encoding="utf-8")
        migration_index = startup_script.find("flask --app app db upgrade")
        gunicorn_index = startup_script.find("exec gunicorn")

        self.assertNotEqual(migration_index, -1)
        self.assertNotEqual(gunicorn_index, -1)
        self.assertLess(migration_index, gunicorn_index)
        self.assertIn(
            "Running database migrations before API start, attempt ${attempt}/${MIGRATION_RETRY_COUNT}...",
            startup_script,
        )
        self.assertIn("Database migrations are up to date.", startup_script)
        self.assertIn(
            "Migration attempt failed; retrying in ${MIGRATION_RETRY_DELAY_SECONDS}s...",
            startup_script,
        )
        self.assertIn(
            "Database migrations failed after ${MIGRATION_RETRY_COUNT} attempts; refusing to start API.",
            startup_script,
        )


if __name__ == "__main__":
    unittest.main()
