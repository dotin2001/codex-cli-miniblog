import sys
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.engine import Engine

from app.config import is_production_like_environment


REQUIRED_SCHEMA_TABLES = frozenset(
    {
        "users",
        "blogs",
        "comments",
        "tags",
        "blog_tags",
    }
)

FLASK_DB_COMMANDS = frozenset(
    {
        "branches",
        "check",
        "current",
        "downgrade",
        "edit",
        "heads",
        "history",
        "init",
        "merge",
        "migrate",
        "revision",
        "show",
        "stamp",
        "upgrade",
    }
)


def is_flask_db_command(argv: Sequence[str] | None = None) -> bool:
    args = list(sys.argv if argv is None else argv)

    return "db" in args and any(command in args for command in FLASK_DB_COMMANDS)


def should_check_schema_readiness(
    config: dict,
    argv: Sequence[str] | None = None,
) -> bool:
    return (
        not config.get("TESTING")
        and is_production_like_environment(config)
        and not is_flask_db_command(argv)
    )


def missing_required_schema_tables(
    engine: Engine,
    required_tables: frozenset[str] = REQUIRED_SCHEMA_TABLES,
) -> list[str]:
    inspector = sa.inspect(engine)
    existing_tables = set(inspector.get_table_names())

    return sorted(required_tables - existing_tables)


def verify_required_schema_tables(
    engine: Engine,
    required_tables: frozenset[str] = REQUIRED_SCHEMA_TABLES,
) -> None:
    missing_tables = missing_required_schema_tables(engine, required_tables)
    if not missing_tables:
        return

    missing = ", ".join(missing_tables)
    raise RuntimeError(
        "Database schema is not ready. Missing required table(s): "
        f"{missing}. Run `flask --app app db upgrade` before starting the API."
    )
