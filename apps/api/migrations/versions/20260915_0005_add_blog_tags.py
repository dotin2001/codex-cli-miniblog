"""add blog tags

Revision ID: 20260915_0005
Revises: 20260915_0004
Create Date: 2026-09-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260915_0005"
down_revision = "20260915_0004"
branch_labels = None
depends_on = None


def upgrade():
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
    op.create_index(op.f("ix_tags_slug"), "tags", ["slug"], unique=True)
    op.create_table(
        "blog_tags",
        sa.Column("blog_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["blog_id"], ["blogs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("blog_id", "tag_id"),
        sa.UniqueConstraint("blog_id", "tag_id", name="uq_blog_tags_blog_id_tag_id"),
    )
    op.create_index(
        "ix_blog_tags_tag_id_blog_id",
        "blog_tags",
        ["tag_id", "blog_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_blog_tags_tag_id_blog_id", table_name="blog_tags")
    op.drop_table("blog_tags")
    op.drop_index(op.f("ix_tags_slug"), table_name="tags")
    op.drop_table("tags")
