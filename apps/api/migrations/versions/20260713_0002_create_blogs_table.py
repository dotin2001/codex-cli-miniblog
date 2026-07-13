"""create blogs table

Revision ID: 20260713_0002
Revises: 20260706_0001
Create Date: 2026-07-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260713_0002"
down_revision = "20260706_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "blogs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("excerpt", sa.String(length=500), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="draft",
            nullable=False,
        ),
        sa.Column("author_id", sa.Integer(), nullable=False),
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
        sa.CheckConstraint("status IN ('draft', 'published')", name="ck_blogs_status"),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_blogs_slug"), "blogs", ["slug"], unique=True)


def downgrade():
    op.drop_index(op.f("ix_blogs_slug"), table_name="blogs")
    op.drop_table("blogs")
