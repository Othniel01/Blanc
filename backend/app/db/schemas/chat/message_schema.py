# app/schemas/message_schema.py
from pydantic import BaseModel
from datetime import datetime

from app.db.schemas.user_profile_schema import UserProfileOut


class MessageBase(BaseModel):
    object_type: str
    object_id: int
    content: str
    message_type: str = "comment"  # default


class MessageCreate(MessageBase):
    pass


class MessageUpdate(BaseModel):
    content: str


class MessageOut(MessageBase):
    id: int
    author_id: int | None
    created_at: datetime
    author: UserProfileOut | None

    class Config:
        orm_mode = True
