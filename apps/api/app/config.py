import os


PRODUCTION_ENV_NAMES = {"production", "prod", "staging"}
UNSAFE_JWT_SECRET_KEYS = {
    "",
    "change-me",
    "changeme",
    "replace-me",
    "replace-with-a-long-random-local-secret",
    "secret",
    "test-jwt-secret",
}


def _parse_cors_origins(value: str | None) -> list[str]:
    if value is None:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

    return [origin.strip() for origin in value.split(",") if origin.strip()]


def normalize_database_url(database_url: str | None) -> str | None:
    if database_url is not None and database_url.startswith("mysql://"):
        return database_url.replace("mysql://", "mysql+pymysql://", 1)

    return database_url


def _runtime_env_name(config: dict) -> str:
    value = (
        config.get("MINIBLOG_ENV")
        or os.getenv("MINIBLOG_ENV")
        or os.getenv("APP_ENV")
        or os.getenv("FLASK_ENV")
        or os.getenv("ENV")
        or "development"
    )
    return str(value).strip().lower()


def _is_unsafe_jwt_secret(value: object) -> bool:
    secret = str(value or "").strip()
    return len(secret) < 32 or secret.lower() in UNSAFE_JWT_SECRET_KEYS


def validate_runtime_config(config: dict) -> None:
    if config.get("TESTING"):
        return

    if _runtime_env_name(config) not in PRODUCTION_ENV_NAMES:
        return

    if _is_unsafe_jwt_secret(config.get("JWT_SECRET_KEY")):
        raise RuntimeError(
            "JWT_SECRET_KEY must be set to a strong non-placeholder value "
            "for production-like environments."
        )


class Config:
    MINIBLOG_ENV = (
        os.getenv("MINIBLOG_ENV")
        or os.getenv("APP_ENV")
        or os.getenv("FLASK_ENV")
        or os.getenv("ENV")
        or "development"
    )
    SQLALCHEMY_DATABASE_URI = (
        normalize_database_url(
            os.getenv("DATABASE_URL")
            or os.getenv("SQLALCHEMY_DATABASE_URI")
            or "mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3306/miniblog"
        )
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", "900")
    )
    JWT_REFRESH_TOKEN_EXPIRES_SECONDS = int(
        os.getenv("JWT_REFRESH_TOKEN_EXPIRES_SECONDS", "604800")
    )
    REFRESH_TOKEN_COOKIE_NAME = os.getenv("REFRESH_TOKEN_COOKIE_NAME", "refreshToken")
    REFRESH_TOKEN_COOKIE_SECURE = (
        os.getenv("REFRESH_TOKEN_COOKIE_SECURE", "false").lower() == "true"
    )
    REFRESH_TOKEN_COOKIE_SAMESITE = os.getenv("REFRESH_TOKEN_COOKIE_SAMESITE", "Lax")
    CORS_ORIGINS = _parse_cors_origins(os.getenv("CORS_ORIGINS"))
