import enum
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


from ..db.session import Base

# --- Association table for many-to-many project <-> tags ---
project_tags = Table(
    "project_tags",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE")),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE")),
)


class ProjectStatusEnum(str, enum.Enum):
    in_progress = "in progress"
    changes_requested = "changes requested"
    approved = "approved"
    cancelled = "cancelled"
    done = "done"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)

    # Project owner
    owner_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    owner = relationship("Users", backref="owned_projects")

    # Timeline
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)

    # Settings
    allow_milestones = Column(Boolean, default=False)
    allow_timesheets = Column(Boolean, default=False)

    # Status
    status = Column(Enum(ProjectStatusEnum), default=ProjectStatusEnum.in_progress)
    active = Column(Boolean, default=True)  # archive toggle

    # Add this relationship to ProjectMember
    members = relationship(
        "ProjectMember",
        backref="project",
        cascade="all, delete-orphan",
    )

    # Favourite
    is_favourite = Column(Boolean, default=False)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=project_tags, back_populates="projects")
    milestones = relationship(
        "Milestone", back_populates="project", cascade="all, delete-orphan"
    )
    stages = relationship(
        "Stage", back_populates="project", cascade="all, delete-orphan"
    )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    color = Column(String(7), nullable=True, default="#999999")  # hex code

    projects = relationship("Project", secondary=project_tags, back_populates="tags")
    tasks = relationship("Task", secondary="task_tags", back_populates="tags")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    project = relationship("Project", back_populates="milestones")


class Stage(Base):
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sequence = Column(Integer, default=0)

    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    project = relationship("Project", back_populates="stages")

    tasks = relationship("Task", back_populates="stage", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String, default="member")  # e.g. member, manager, viewer
    joined_at = Column(DateTime, server_default=func.now())

    user = relationship("Users", back_populates="project_members")
