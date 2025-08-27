# app/models/message.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..db.session import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    # Generic relation: record that owns this message
    object_type = Column(String, nullable=False)  # e.g. "task", "project"
    object_id = Column(Integer, nullable=False)  # ID of the record

    # Message content
    message_type = Column(String, default="comment")
    # Options: "comment" (user message), "system" (system-generated note),
    # "audit" (activity log like stage change, assignment, etc.)
    content = Column(Text, nullable=False)

    # Author
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    author = relationship("Users")

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
