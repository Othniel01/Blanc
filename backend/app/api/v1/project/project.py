# app/api/routes/project.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

from app.services.notification_service import NotificationService

from ....db.session import get_db
from ....models.project import Project, ProjectMember, Tag
from ....models.users import Users
from ....models.tasks import Task
from ....models.message import Message
from ....db.schemas.projects.project_schema import (
    AddMemberRequest,
    ProjectCreate,
    ProjectUpdate,
    ProjectOut,
    ProjectMemberOut,
)
from ....db.schemas.projects.task_schema import TaskOut
from ....db.schemas.projects.tag_schema import TagOut
from ....db.schemas.chat.message_schema import MessageOut
from ....services.auth_service import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


# -----------------------------
# Create a project
# -----------------------------
@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    new_project = Project(
        name=project.name,
        description=project.description,
        owner_id=current_user.id,
        allow_milestones=project.allow_milestones,
        is_favourite=project.is_favourite,
        allow_timesheets=project.allow_timesheets,
        status=project.status,
        active=project.active,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    project_manager = ProjectMember(
        project_id=new_project.id, user_id=current_user.id, role="manager"
    )
    db.add(project_manager)
    db.commit()
    return new_project


# -----------------------------
# Get all projects current user has access to
# -----------------------------
# @router.get("/", response_model=List[ProjectOut])
# def get_projects(
#     db: Session = Depends(get_db),
#     current_user: Users = Depends(get_current_user),
# ):
#     projects = (
#         db.query(Project)
#         .join(ProjectMember, ProjectMember.project_id == Project.id)
#         .filter(
#             (Project.owner_id == current_user.id)
#             | (ProjectMember.user_id == current_user.id)
#         )
#         .all()
#     )
#     if not projects:
#         raise HTTPException(status_code=404, detail="No projects found")
#     return projects


@router.get("/projects")
def list_projects(
    manager_only: bool = Query(False),
    member_only: bool = Query(False),
    favourite: bool = Query(False),
    archived: Optional[bool] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    tags: Optional[List[str]] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    query = db.query(Project)

    # Role filtering
    if manager_only and member_only:
        query = query.join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id,
            ProjectMember.role.in_(["manager", "member"]),
        )
    elif manager_only:
        query = query.join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id, ProjectMember.role == "manager"
        )
    elif member_only:
        query = query.join(ProjectMember).filter(
            ProjectMember.user_id == current_user.id, ProjectMember.role == "member"
        )

    # Favourite filter
    if favourite:
        query = query.filter(Project.is_favourite == True)

    # Archived filter
    if archived is True:
        query = query.filter(Project.active == False)
    elif archived is False:
        query = query.filter(Project.active == True)

    # Date filters
    if start_date:
        query = query.filter(Project.start_date >= start_date)
    if end_date:
        query = query.filter(Project.start_date <= end_date)

    # Tags filter
    if tags:
        query = query.join(Project.tags).filter(Tag.name.in_(tags)).distinct()

    # Pagination
    projects = query.offset(skip).limit(limit).all()

    return projects


# Bulk delete


@router.delete("/bulk", status_code=status.HTTP_200_OK)
def bulk_delete_projects(
    project_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """
    Bulk delete projects.
    Only project managers of each project can delete.
    """
    deleted_projects = []
    unauthorized_projects = []
    not_found_projects = []

    for pid in project_ids:
        project = db.query(Project).filter(Project.id == pid).first()

        if not project:
            not_found_projects.append(pid)
            continue

        # check membership & role
        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == pid,
                ProjectMember.user_id == current_user.id,
            )
            .first()
        )

        if not member or member.role != "manager":
            unauthorized_projects.append(pid)
            continue

        db.delete(project)
        deleted_projects.append(pid)

    db.commit()

    return {
        "deleted": deleted_projects,
        "unauthorized": unauthorized_projects,
        "not_found": not_found_projects,
    }


#  Bulk Archive


@router.put("/bulk/archive", status_code=status.HTTP_200_OK)
def bulk_archive_projects(
    project_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    archived_projects, unauthorized, not_found = [], [], []

    for pid in project_ids:
        project = db.query(Project).filter(Project.id == pid).first()
        if not project:
            not_found.append(pid)
            continue

        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == pid,
                ProjectMember.user_id == current_user.id,
            )
            .first()
        )
        if not member or member.role != "manager":
            unauthorized.append(pid)
            continue

        project.active = False
        archived_projects.append(pid)

    db.commit()
    return {
        "archived": archived_projects,
        "unauthorized": unauthorized,
        "not_found": not_found,
    }


# Bulk Duplicate
@router.post("/bulk/duplicate", status_code=status.HTTP_201_CREATED)
def bulk_duplicate_projects(
    project_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    duplicated, unauthorized, not_found = [], [], []

    for pid in project_ids:
        project = db.query(Project).filter(Project.id == pid).first()
        if not project:
            not_found.append(pid)
            continue

        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == pid,
                ProjectMember.user_id == current_user.id,
            )
            .first()
        )
        if not member or member.role != "manager":
            unauthorized.append(pid)
            continue

        new_project = Project(
            name=f"{project.name} (Copy)",
            description=project.description,
            owner_id=current_user.id,
            allow_milestones=project.allow_milestones,
            is_favourite=False,
            allow_timesheets=project.allow_timesheets,
            status="draft",
            active=True,
            start_date=project.start_date,
            end_date=project.end_date,
        )
        db.add(new_project)
        db.flush()  # get new id before commit
        duplicated.append(new_project.id)

    db.commit()

    # ensure duplicator is added as manager
    project_member = ProjectMember(
        project_id=new_project.id, user_id=current_user.id, role="manager"
    )
    db.add(project_member)
    db.commit()

    return {
        "duplicated": duplicated,
        "unauthorized": unauthorized,
        "not_found": not_found,
    }


# -----------------------------
# Get a project by ID
# -----------------------------
@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and not member:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this project"
        )
    return project


# -----------------------------
# Update a project
@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    updated_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and (not member or member.role != "manager"):
        raise HTTPException(
            status_code=403, detail="Not authorized to update this project"
        )

    update_data = updated_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


# -----------------------------
# Delete a project (only project manager)
# -----------------------------
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not member or member.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this project. Only project managers can delete.",
        )

    db.delete(project)
    db.commit()
    return None


# -----------------------------
# Project tags
# -----------------------------
@router.get("/{project_id}/tags", response_model=List[TagOut])
def get_project_tags(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and not member:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this project's tags"
        )
    return project.tags


# Archive


@router.put("/{project_id}/archive", status_code=status.HTTP_200_OK)
def archive_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not member or member.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to archive this project. Only project managers can archive.",
        )

    project.active = False
    db.commit()
    db.refresh(project)
    return {"archived": project.id}


# Duplicate


@router.post("/{project_id}/duplicate", status_code=status.HTTP_201_CREATED)
def duplicate_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not member or member.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to duplicate this project. Only project managers can duplicate.",
        )

    # create a duplicate project
    new_project = Project(
        name=f"{project.name} (Copy)",
        description=project.description,
        owner_id=current_user.id,
        allow_milestones=project.allow_milestones,
        is_favourite=False,
        allow_timesheets=project.allow_timesheets,
        status="draft",
        active=True,
        start_date=project.start_date,
        end_date=project.end_date,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # ensure duplicator is added as manager
    project_member = ProjectMember(
        project_id=new_project.id, user_id=current_user.id, role="manager"
    )
    db.add(project_member)
    db.commit()

    return {"duplicated": new_project.id}


# -----------------------------
# Project tasks
# -----------------------------
@router.get("/{project_id}/tasks", response_model=List[TaskOut])
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and not member:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this project's tasks"
        )

    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    return [TaskOut.from_orm_with_assignees(task) for task in tasks]


# -----------------------------
# Project messages/comments
# -----------------------------
@router.get("/{project_id}/messages", response_model=List[MessageOut])
def get_project_messages(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and not member:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this project's messages"
        )

    return (
        db.query(Message)
        .filter(Message.object_type == "project", Message.object_id == project_id)
        .order_by(Message.created_at.asc())
        .all()
    )


# -----------------------------
# Project members
# -----------------------------
@router.post("/{project_id}/members", response_model=ProjectMemberOut)
def add_project_member(
    project_id: int,
    request: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and (not member or member.role != "manager"):
        raise HTTPException(
            status_code=403, detail="Not authorized to add members to this project"
        )

    # Look up user by invite code
    invited_user = (
        db.query(Users).filter(Users.invite_code == request.invite_code).first()
    )
    if not invited_user:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if already in project
    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == invited_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already a member of project")

    # Add new member
    new_member = ProjectMember(
        project_id=project_id, user_id=invited_user.id, role="member"
    )
    db.add(new_member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not add member")

    db.refresh(new_member)

    notification_service = NotificationService(db)
    notification_service.notify(
        user_id=invited_user.id,
        notif_type="project",
        message=f"You’ve been added to project '{project.name}'",
        entity_type="Project",
        entity_id=project.id,
    )
    return new_member


# Get members


@router.get("/{project_id}/members", response_model=List[ProjectMemberOut])
def list_project_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and not member:
        raise HTTPException(
            status_code=403, detail="Not authorized to view members of this project"
        )

    return db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if project.owner_id != current_user.id and (not member or member.role != "manager"):
        raise HTTPException(
            status_code=403, detail="Not authorized to remove members from this project"
        )

    member_to_remove = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
        )
        .first()
    )
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member_to_remove)
    db.commit()
    return {"message": f"User {user_id} removed from project {project_id}"}
