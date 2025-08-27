from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ....db.session import get_db
from ....models.users import Users, UserSecurity, SecurityQuestion
from ....db.schemas.user_profile_schema import (
    UserProfileResponse,
    UserProfileUpdate,
    ChangePasswordSchema,
    SetSecuritySchema,
    ResetPasswordSchema,
    SecurityQuestionResponse,
)
from ....core.security.security import get_password_hash, verify_password
from ....services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


# 1. Get My Profile
@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: Users = Depends(get_current_user)):
    return current_user


# 2. Update Profile Info
@router.put("/me", response_model=UserProfileResponse)
def update_me(
    update_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    # Ensure we fetch the user from this session
    db_user = db.query(Users).filter(Users.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only update provided fields
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_user, field, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# 3. Change Password
@router.post("/change-password")
def change_password(
    payload: ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    # Re-fetch from DB to make sure it's attached to this session
    db_user = db.query(Users).filter(Users.id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.old_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    # Hash & update new password
    db_user.hashed_password = get_password_hash(payload.new_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"msg": "Password updated successfully"}


# --BREAK--


# 6. Get Available Security Questions
@router.get("/security-questions", response_model=list[SecurityQuestionResponse])
def get_security_questions(db: Session = Depends(get_db)):
    return db.query(SecurityQuestion).all()


# 7. Set Security Question for Users
@router.post("/set-security-question")
def set_security_question(
    payload: SetSecuritySchema,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    question = (
        db.query(SecurityQuestion)
        .filter(SecurityQuestion.id == payload.question_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Invalid security question")

    # either insert or update
    user_security = (
        db.query(UserSecurity).filter(UserSecurity.user_id == current_user.id).first()
    )
    if not user_security:
        user_security = UserSecurity(
            user_id=current_user.id,
            question_id=payload.question_id,
            answer_hash=get_password_hash(payload.answer),
        )
        db.add(user_security)
    else:
        user_security.question_id = payload.question_id
        user_security.answer_hash = get_password_hash(payload.answer)

    db.commit()
    return {"msg": "Security question set successfully"}


# 8. Get Users Security Question (for password reset)
@router.get("/security-question/{username}", response_model=SecurityQuestionResponse)
def get_user_security_question(username: str, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.username == username).first()
    if not user or not user.security:
        raise HTTPException(
            status_code=404, detail="Users or security question not found"
        )
    return user.security.question


# 9. Reset Password via Security Question
@router.post("/reset-password")
def reset_password(payload: ResetPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.username == payload.username).first()
    if not user or not user.security:
        raise HTTPException(
            status_code=404, detail="User not found or no security question set"
        )

    if not verify_password(payload.answer, user.security.answer_hash):
        raise HTTPException(status_code=400, detail="Security answer is incorrect")

    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"msg": "Password reset successfully"}


# # 4. Upload Profile Image
# @router.post("/me/profile-image")
# def upload_profile_image(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user: Users = Depends(get_current_user),
# ):
#     filename = f"user_{current_user.id}_{file.filename}"
#     filepath = f"uploads/{filename}"
#     with open(filepath, "wb") as buffer:
#         buffer.write(file.file.read())
#     current_user.profile_image = filepath
#     db.commit()
#     db.refresh(current_user)
#     return {"msg": "Profile image uploaded", "profile_image": filepath}


# # 5. Delete Profile Image
# @router.delete("/me/profile-image")
# def delete_profile_image(
#     db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)
# ):
#     if not current_user.profile_image:
#         raise HTTPException(status_code=404, detail="No profile image found")
#     current_user.profile_image = None
#     db.commit()
#     return {"msg": "Profile image deleted"}
