"""repair blog tag tables

Revision ID: 20260917_0006
Revises: 20260915_0005
Create Date: 2026-09-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260917_0006"
down_revision = "20260915_0005"
branch_labels = None
depends_on = None


def _table_names() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return set(inspector.get_table_names())


def _index_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade():
    table_names = _table_names()

    if "tags" not in table_names:
        op.create_table(
            "tags",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=40), nullable=False),
            sa.Column("slug", sa.String(length=40), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        table_names.add("tags")

    if "ix_tags_slug" not in _index_names("tags"):
        op.create_index(op.f("ix_tags_slug"), "tags", ["slug"], unique=True)

    if "blog_tags" not in table_names:
        op.create_table(
            "blog_tags",
            sa.Column("blog_id", sa.Integer(), nullable=False),
            sa.Column("tag_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["blog_id"], ["blogs.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("blog_id", "tag_id"),
            sa.UniqueConstraint(
                "blog_id",
                "tag_id",
                name="uq_blog_tags_blog_id_tag_id",
            ),
        )

    if "ix_blog_tags_tag_id_blog_id" not in _index_names("blog_tags"):
        op.create_index(
            "ix_blog_tags_tag_id_blog_id",
            "blog_tags",
            ["tag_id", "blog_id"],
            unique=False,
        )


def downgrade():
    # This repair migration is intentionally non-destructive. The previous
    # migration owns the table downgrade behavior.
    pass
