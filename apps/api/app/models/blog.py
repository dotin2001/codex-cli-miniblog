from sqlalchemy.sql import func

from app.extensions import db


class Blog(db.Model):
    __tablename__ = "blogs"
    __table_args__ = (
        db.CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_blogs_status",
        ),
    )

    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), nullable=False, unique=True, index=True)
    excerpt = db.Column(db.String(500), nullable=True)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(
        db.String(20),
        nullable=False,
        default=STATUS_DRAFT,
        server_default=STATUS_DRAFT,
    )
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
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

    author = db.relationship("User", back_populates="blogs")
