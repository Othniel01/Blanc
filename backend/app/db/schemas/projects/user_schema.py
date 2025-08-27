from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserOut(UserBase):
    id: int
    is_active: bool
    role: str  # e.g. "admin", "project_manager", "user"

    class Config:
        orm_mode = True
