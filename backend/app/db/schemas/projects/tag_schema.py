from pydantic import BaseModel
from typing import Optional


class TagBase(BaseModel):
    name: str
    color: Optional[str] = None  # optional hex code


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class TagOut(TagBase):
    id: int

    class Config:
        orm_mode = True
