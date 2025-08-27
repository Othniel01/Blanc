from pydantic import BaseModel
from datetime import datetime


class MilestoneBase(BaseModel):
    name: str
    due_date: datetime | None = None


class MilestoneCreate(MilestoneBase):
    project_id: int


class MilestoneOut(MilestoneBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True
