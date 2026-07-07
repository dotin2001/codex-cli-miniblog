from flask import Flask

from app.config import Config
from app.extensions import db, migrate
from app.routes.auth import auth_bp
from app.routes.health import health_bp


def create_app(config_object: type[Config] | None = None) -> Flask:
    app = Flask(__name__)

    app.config.from_object(config_object or Config)
    db.init_app(app)
    from app import models  # noqa: F401

    migrate.init_app(app, db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)

    return app
