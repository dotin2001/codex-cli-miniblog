from sqlalchemy.sql import func

from app.extensions import db


class Comment(db.Model):
    __tablename__ = "comments"
    __table_args__ = (
        db.Index("ix_comments_blog_id_created_at_id", "blog_id", "created_at", "id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    blog_id = db.Column(
        db.Integer,
        db.ForeignKey("blogs.id", ondelete="CASCADE"),
        nullable=False,
    )
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

    author = db.relationship("User", back_populates="comments")
    blog = db.relationship("Blog", back_populates="comments")
