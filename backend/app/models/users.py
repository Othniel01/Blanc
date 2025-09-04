from ..db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.orm import relationship


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    phone_number = Column(String, nullable=True)
    invite_code = Column(String(10), unique=True, nullable=False)

    # new fields
    profile_image = Column(String, nullable=True)  # URL to profile picture
    date_joined = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationship to role
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")
    security = relationship("UserSecurity", back_populates="user", uselist=False)
    project_members = relationship("ProjectMember", back_populates="user")
    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )


class UserSecurity(Base):
    __tablename__ = "user_security"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("security_questions.id"))
    answer_hash = Column(String, nullable=False)

    user = relationship("Users", back_populates="security")
    question = relationship("SecurityQuestion")


class SecurityQuestion(Base):
    __tablename__ = "security_questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False, unique=True)
