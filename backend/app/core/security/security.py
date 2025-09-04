import secrets
from jose import jwt
from datetime import datetime, timedelta, timezone, UTC
from passlib.context import CryptContext
from ..config import settings


bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str):
    return bcrypt_context.hash(password)


def verify_password(plain_password, hashed_password):
    return bcrypt_context.verify(plain_password, hashed_password)


def create_access_token(
    username: str, user_id: int, role: str, expires_delta: timedelta
):
    to_encode = {"sub": username, "id": user_id, "role": role}
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(user_id: int, db, expires_days: int = 30):
    # Generate random string for refresh token
    token = secrets.token_urlsafe(64)
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    from app.models.refresh_token import RefreshToken

    db_token = RefreshToken(
        user_id=user_id, token=token, expires_at=expires_at, revoked=False
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token
