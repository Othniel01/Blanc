from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubTaskBase(BaseModel):
    title: str
    is_done: bool = False


class SubTaskCreate(SubTaskBase):
    pass


class SubTaskUpdate(BaseModel):
    title: Optional[str] = None
    is_done: Optional[bool] = None


class SubTaskOut(SubTaskBase):
    id: int
    task_id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
