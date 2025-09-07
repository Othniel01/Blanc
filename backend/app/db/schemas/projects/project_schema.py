from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.schemas.user_profile_schema import UserProfileOut, UserProfileResponse


# ---------- Shared Base ----------
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    allow_milestones: bool = False
    is_favourite: Optional[bool] = False
    allow_timesheets: bool = False
    status: str = "in progress"
    active: bool = True


class AddMemberRequest(BaseModel):
    invite_code: str


# --BREAK--
# ---------- Create Schema ----------
class ProjectCreate(ProjectBase):
    # Only admin / project manager will use this
    pass


# ---------- Update Schema ----------
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_favourite: Optional[bool] = None
    allow_milestones: Optional[bool] = None
    allow_timesheets: Optional[bool] = None
    status: Optional[str] = None
    active: Optional[bool] = None


# ---------- DB-facing / Response Schema ----------
class ProjectOut(ProjectBase):
    id: int
    owner_id: Optional[int] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    created_at: datetime
    is_favourite: Optional[bool] = None
    updated_at: Optional[datetime] = None
    owner: UserProfileOut

    class Config:
        from_attributes = True


# ---------- Project Member Schema ----------


class ProjectMemberBase(BaseModel):
    role: str = "member"  # default role


class ProjectMemberCreate(ProjectMemberBase):
    user_id: int


class ProjectMemberOut(ProjectMemberBase):
    id: int
    project_id: int
    user_id: int
    joined_at: datetime
    user: UserProfileResponse

    class Config:
        orm_mode = True


# ---------- With Relations ----------
class ProjectWithRelations(ProjectOut):
    tags: List["TagOut"] = []
    milestones: List["MilestoneOut"] = []
    stages: List["StageOut"] = []
    tasks: List["TaskOut"] = []


# avoid circular imports with forward refs
from .tag_schema import TagOut
from .milestone_schema import MilestoneOut
from .stage_schema import StageOut
from .task_schema import TaskOut

ProjectWithRelations.model_rebuild()
