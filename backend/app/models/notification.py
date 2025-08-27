from ..db.session import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    type = Column(String, nullable=False)  # "project", "task", "comment"
    entity_id = Column(Integer, nullable=True)  # ID of related entity
    entity_type = Column(String, nullable=True)  # "Project", "Task" etc.
    message = Column(String, nullable=False)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
