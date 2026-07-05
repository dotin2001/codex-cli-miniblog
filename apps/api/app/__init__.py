from flask import Flask

from app.extensions import db
from app.routes.health import health_bp


def create_app() -> Flask:
    app = Flask(__name__)

    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    if app.config.get("SQLALCHEMY_DATABASE_URI"):
        db.init_app(app)

    app.register_blueprint(health_bp)

    return app
