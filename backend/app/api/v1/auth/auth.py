from fastapi import APIRouter, Depends, HTTPException
from datetime import timedelta
from typing import Annotated
from starlette import status

from app.models.roles import Role
from app.services.uuid_generator import generate_invite_code
from ....models.users import Users
from ....core.security.security import bcrypt_context, create_access_token
from ....db.deps import db_dependency
from ....db.schemas.auth.auth import CreateUserRequest, Token
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

    token = create_access_token(
        user.username,
        user.id,
        role_name,  # role from roles table
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {"access_token": token, "token_type": "bearer"}
