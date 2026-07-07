import os


class Config:
    SQLALCHEMY_DATABASE_URI = (
        os.getenv("DATABASE_URL")
        or os.getenv("SQLALCHEMY_DATABASE_URI")
        or "mysql+pymysql://miniblog:miniblog_password@127.0.0.1:3306/miniblog"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", "900")
    )
