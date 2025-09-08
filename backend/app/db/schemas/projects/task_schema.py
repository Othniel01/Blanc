from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "in progress"
    active: bool = True
    priority: int = Field(3, ge=1, le=5)


class TaskCreate(TaskBase):
    project_id: int  # must belong to a project
    stage_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = []
    milestone_id: Optional[int] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    active: Optional[bool] = None
    stage_id: Optional[int] = None
    assignee_ids: Optional[List[int]] = []
    milestone_id: Optional[int] = None
    priority: int | None = Field(None, ge=1, le=5)


class TaskOut(TaskBase):
    id: int
    project_id: int
    stage_id: Optional[int] = None
    assignee_ids: List[int] = Field(default_factory=list)
    milestone_id: Optional[int] = None
    creator_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_assignees(cls, task):
        return cls(
            id=task.id,
            name=task.name,
            description=task.description,
            due_date=task.due_date,
            status=task.status.value if task.status else None,
            active=task.active,
            priority=task.priority,
            project_id=task.project_id,
            stage_id=task.stage_id,
            milestone_id=task.milestone_id,
            creator_id=task.creator_id,
            created_at=task.created_at,
            updated_at=task.updated_at,
            assignee_ids=[u.id for u in task.assignees],
        )


class TaskWithRelations(TaskOut):
    tags: List["TagOut"] = []
    project: Optional["ProjectOut"] = None
    stage: Optional["StageOut"] = None
    milestone: Optional["MilestoneOut"] = None
    assignee_ids: Optional[List[int]] = []


from .tag_schema import TagOut
from .project_schema import ProjectOut
from .stage_schema import StageOut
from .milestone_schema import MilestoneOut


TaskWithRelations.model_rebuild()
