from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.project import ProjectMember
from app.models.users import Users


def is_admin(user: dict):
    return user.get("is_superuser", False)


def get_project_role(db: Session, user_id: int, project_id: int) -> str | None:
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
        )
        .first()
    )
    return member.role if member else None


def require_project_role(
    db: Session, user: Users, project_id: int, allowed_roles: list[str]
):
    if is_admin(user):
        return True
    role = get_project_role(db, user.id, project_id)
    if not role or role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized")
