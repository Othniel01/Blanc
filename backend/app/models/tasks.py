from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Table,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..db.session import Base


# --- Association table: task <-> tags (many-to-many) ---
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE")),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE")),
)


# --- Association table: task <-> users (many-to-many assignees) ---
task_assignees = Table(
    "task_assignees",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id", ondelete="CASCADE")),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
)


# --- Task status enum (fixed options) ---
class TaskStatusEnum(str, enum.Enum):
    in_progress = "In Progress"
    changes_requested = "Changes Requested"
    approved = "Approved"
    cancelled = "Cancelled"
    done = "Done"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Relations
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    project = relationship("Project", back_populates="tasks")

    priority = Column(Integer, nullable=True, default=3)

    milestone_id = Column(Integer, ForeignKey("milestones.id", ondelete="SET NULL"))
    milestone = relationship("Milestone", backref="tasks")

    stage_id = Column(
        Integer, ForeignKey("stages.id", ondelete="SET NULL"), nullable=True
    )
    stage = relationship("Stage", back_populates="tasks")

    # parent_task_id = Column(
    #     Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True
    # )
    # parent_task = relationship("Task", remote_side=[id], backref="subtasks")

    # Core fields
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.in_progress)
    active = Column(Boolean, default=True)

    # Dates
    start_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    creator = relationship("Users", backref="created_tasks")

    # Relationships
    assignees = relationship("Users", secondary=task_assignees, backref="tasks")
    tags = relationship("Tag", secondary=task_tags, back_populates="tasks")
    attachments = relationship(
        "TaskAttachment", back_populates="task", cascade="all, delete-orphan"
    )
    subtasks = relationship(
        "SubTask",
        back_populates="task",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)

    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    task = relationship("Task", back_populates="attachments")

    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    uploader = relationship("Users", backref="uploaded_files")

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class SubTask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    is_done = Column(Boolean, default=False)

    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    task = relationship("Task", back_populates="subtasks")

    # Audit
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    owner = relationship("Users", backref="subtasks")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
