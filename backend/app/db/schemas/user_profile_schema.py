from pydantic import BaseModel
from typing import Optional


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone_number: Optional[str]
    invite_code: Optional[str]
    profile_image: Optional[str]

    class Config:
        orm_mode = True


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None


class ChangePasswordSchema(BaseModel):
    old_password: str
    new_password: str


class SetSecuritySchema(BaseModel):
    question_id: int
    answer: str


class ResetPasswordSchema(BaseModel):
    username: str
    answer: str
    new_password: str


class SecurityQuestionResponse(BaseModel):
    id: int
    question: str

    class Config:
        orm_mode = True
