from pydantic import BaseModel, EmailStr


class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    phone_number: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str
