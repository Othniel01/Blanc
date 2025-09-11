from pydantic import BaseModel
from typing import Optional


class StageBase(BaseModel):
    name: str
    sequence: Optional[int] = 0


class StageCreate(StageBase):
    pass


class StageUpdate(BaseModel):
    name: Optional[str] = None
    sequence: Optional[int] = None
    is_default: Optional[bool] = None


class StageOut(StageBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True
