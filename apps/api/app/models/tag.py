from sqlalchemy.sql import func

from app.extensions import db


blog_tags = db.Table(
    "blog_tags",
    db.Column(
        "blog_id",
        db.Integer,
        db.ForeignKey("blogs.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "tag_id",
        db.Integer,
        db.ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.UniqueConstraint("blog_id", "tag_id", name="uq_blog_tags_blog_id_tag_id"),
    db.Index("ix_blog_tags_tag_id_blog_id", "tag_id", "blog_id"),
)


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(40), nullable=False)
    slug = db.Column(db.String(40), nullable=False, unique=True, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    blogs = db.relationship(
        "Blog",
        secondary=blog_tags,
        back_populates="tags",
    )
