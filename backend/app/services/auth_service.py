from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from starlette import status
from sqlalchemy.orm import joinedload

from app.db.session import SessionLocal
from ..models.users import Users
from ..core.config import settings
from ..core.security.security import verify_password


oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")


def authenticate_user(username: str, password: str, db):
    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: int = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate user")

        db = SessionLocal()
        user = (
            db.query(Users)
            .options(joinedload(Users.role))
            .filter(Users.id == user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user  # role is already loaded
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate user")
