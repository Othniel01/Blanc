from pydantic import BaseModel, EmailStr


class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    website: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str
