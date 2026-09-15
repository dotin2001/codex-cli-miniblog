"""harden blog and comment database behavior

Revision ID: 20260915_0004
Revises: 20260715_0003
Create Date: 2026-09-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260915_0004"
down_revision = "20260715_0003"
branch_labels = None
depends_on = None


def _foreign_key_name(table_name, constrained_columns, referred_table):
    inspector = sa.inspect(op.get_bind())
    wanted_columns = list(constrained_columns)

    for foreign_key in inspector.get_foreign_keys(table_name):
        if (
            foreign_key.get("constrained_columns") == wanted_columns
            and foreign_key.get("referred_table") == referred_table
        ):
            return foreign_key.get("name")

    return None


def _replace_foreign_key(
    table_name,
    constrained_columns,
    referred_table,
    referred_columns,
    name,
    ondelete=None,
):
    existing_name = _foreign_key_name(table_name, constrained_columns, referred_table)
    if existing_name is not None:
        op.drop_constraint(existing_name, table_name, type_="foreignkey")

    op.create_foreign_key(
        name,
        table_name,
        referred_table,
        constrained_columns,
        referred_columns,
        ondelete=ondelete,
    )


def upgrade():
    op.create_index(
        "ix_blogs_status_created_at_id",
        "blogs",
        ["status", "created_at", "id"],
        unique=False,
    )
    op.create_index(
        "ix_blogs_author_id_created_at_id",
        "blogs",
        ["author_id", "created_at", "id"],
        unique=False,
    )
    op.create_index(
        "ix_comments_blog_id_created_at_id",
        "comments",
        ["blog_id", "created_at", "id"],
        unique=False,
    )
    _replace_foreign_key(
        "comments",
        ["blog_id"],
        "blogs",
        ["id"],
        "fk_comments_blog_id_blogs",
        ondelete="CASCADE",
    )


def downgrade():
    _replace_foreign_key(
        "comments",
        ["blog_id"],
        "blogs",
        ["id"],
        "fk_comments_blog_id_blogs",
    )
    op.drop_index("ix_comments_blog_id_created_at_id", table_name="comments")
    op.drop_index("ix_blogs_author_id_created_at_id", table_name="blogs")
    op.drop_index("ix_blogs_status_created_at_id", table_name="blogs")
