from fastapi import APIRouter, Depends, HTTPException
from datetime import UTC, datetime, timedelta
from typing import Annotated
from starlette import status

from app.models.refresh_token import RefreshToken
from app.models.roles import Role
from app.services.uuid_generator import generate_invite_code
from ....models.users import Users
from ....core.security.security import (
    bcrypt_context,
    create_access_token,
    create_refresh_token,
)
from ....db.deps import db_dependency
from ....db.schemas.auth.auth import (
    CreateUserRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    Token,
)
from fastapi.security import OAuth2PasswordRequestForm
from ....services.auth_service import authenticate_user
from ....core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: CreateUserRequest):
    # Get default role "user"
    default_role = db.query(Role).filter(Role.name == "user").first()
    if not default_role:
        raise HTTPException(
            status_code=500, detail="Default role not found. Seed roles first."
        )

    # Generate unique invite code
    code = generate_invite_code()
    while db.query(Users).filter(Users.invite_code == code).first():
        code = generate_invite_code()

    create_user_model = Users(
        email=create_user_request.email,
        username=create_user_request.username,
        first_name=create_user_request.first_name,
        last_name=create_user_request.last_name,
        role_id=default_role.id,  # assign FK, not string
        phone_number=create_user_request.phone_number,
        hashed_password=bcrypt_context.hash(create_user_request.password),
        is_active=True,
        invite_code=code,
    )

    db.add(create_user_model)
    db.commit()
    db.refresh(create_user_model)

    return {
        "msg": "User created successfully",
        "invite_code": create_user_model.invite_code,
    }


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: db_dependency,
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate user."
        )

    role_name = user.role.name if user.role else "user"

    access_token = create_access_token(
        user.username,
        user.id,
        role_name,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    refresh_token = create_refresh_token(user.id, db)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token.token,
    }


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(request: RefreshTokenRequest, db: db_dependency):
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == request.refresh_token, RefreshToken.revoked == False
        )
        .first()
    )
    if not db_token or db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db_token.user
    role_name = user.role.name if user.role else "user"

    access_token = create_access_token(
        user.username,
        user.id,
        role_name,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(refresh_token: str, db: db_dependency):
    db_token = (
        db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    )
    if not db_token:
        raise HTTPException(status_code=404, detail="Refresh token not found")

    db_token.revoked = True
    db.commit()
    return {"msg": "Logged out successfully"}
