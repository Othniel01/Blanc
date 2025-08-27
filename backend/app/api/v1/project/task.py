# app/api/routes/task.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.schemas.chat.message_schema import MessageOut
from app.db.schemas.projects.tag_schema import TagOut
from app.services.notification_service import NotificationService
from ....db.session import get_db
from ....models.tasks import Task, TaskStatusEnum
from ....db.schemas.projects.task_schema import TaskCreate, TaskUpdate, TaskOut
from ....models.users import Users
from ....services.auth_service import get_current_user
from ....models.message import Message
from ....models.project import Project, ProjectMember, Tag

router = APIRouter(prefix="/tasks", tags=["Tasks"])


# --- Helper: check project membership ---
def require_project_membership(db: Session, project_id: int, user_id: int):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.owner_id == user_id:
        return project  # owner always allowed

    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id, ProjectMember.user_id == user_id
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    return project


# -----------------------------
# Create a task
# -----------------------------
@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    # Ensure current_user is a member of the project
    project = require_project_membership(db, task.project_id, current_user.id)

    db_assignees = []
    if task.assignee_ids:
        # Assignees must also be project members
        db_assignees = (
            db.query(Users)
            .join(ProjectMember, ProjectMember.user_id == Users.id)
            .filter(
                ProjectMember.project_id == task.project_id,
                Users.id.in_(task.assignee_ids),
            )
            .all()
        )

    new_task = Task(
        name=task.name,
        description=task.description,
        project_id=task.project_id,
        milestone_id=task.milestone_id,
        stage_id=task.stage_id,
        priority=task.priority,
        due_date=task.due_date,
        assignees=db_assignees,
        creator_id=current_user.id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


# -----------------------------
# Read all tasks (filtered by membership)
# -----------------------------
@router.get("/", response_model=List[TaskOut])
def get_tasks(
    project_id: Optional[int] = Query(None),
    archived: Optional[bool] = Query(None),
    open_only: bool = Query(False),
    created_by_me: bool = Query(False),
    assigned_to_me: bool = Query(False),
    deadline_before: Optional[date] = Query(None),
    deadline_after: Optional[date] = Query(None),
    tags: Optional[List[str]] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    query = db.query(Task)

    # Project scoping
    if project_id:
        require_project_membership(db, project_id, current_user.id)
        query = query.filter(Task.project_id == project_id)
    else:
        query = (
            query.join(Project)
            .outerjoin(ProjectMember, ProjectMember.project_id == Task.project_id)
            .filter(
                (Project.owner_id == current_user.id)
                | (ProjectMember.user_id == current_user.id)
            )
        )

    # Archived filter
    if archived is True:
        query = query.filter(Task.active == False)
    elif archived is False:
        query = query.filter(Task.active == True)

    # Open tasks (active and not completed)
    if open_only:
        query = query.filter(Task.active == True, Task.status != TaskStatusEnum.done)

    # Created by current user
    if created_by_me:
        query = query.filter(Task.created_by_id == current_user.id)

    # Assigned to current user
    if assigned_to_me:
        query = query.join(Task.assignees).filter(Users.id == current_user.id)

    # Deadline filters
    if deadline_before:
        query = query.filter(Task.deadline <= deadline_before)
    if deadline_after:
        query = query.filter(Task.deadline >= deadline_after)

    # Tags filtering (if Task has many-to-many with Tag)
    if tags:
        query = query.join(Task.tags).filter(Tag.name.in_(tags)).distinct()

    # Pagination
    tasks = query.offset(skip).limit(limit).all()

    return [TaskOut.from_orm_with_assignees(task) for task in tasks]


# Bulk delete


@router.delete("/bulk", status_code=status.HTTP_200_OK)
def bulk_delete_tasks(
    task_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """
    Bulk delete projects.
    Only project managers of each project can delete.
    """
    deleted_task = []
    unauthorized_task = []
    not_found_task = []

    for tid in task_ids:
        task = db.query(Task).filter(Task.id == tid).first()

        if not task:
            not_found_task.append(tid)
            continue

        # check membership & role
        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == task.project_id,
                ProjectMember.user_id == current_user.id,
            )
            .first()
        )

        if not member or member.role != "manager":
            unauthorized_task.append(tid)
            continue

        db.delete(task)
        deleted_task.append(tid)

    db.commit()

    return {
        "deleted": deleted_task,
        "unauthorized": unauthorized_task,
        "not_found": not_found_task,
    }


#  Bulk Archive


@router.put("/bulk/archive", status_code=status.HTTP_200_OK)
def bulk_archive_tasks(
    task_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    archived_tasks, unauthorized, not_found = [], [], []

    for tid in task_ids:
        task = db.query(Task).filter(Task.id == tid).first()
        if not task:
            not_found.append(tid)
            continue

        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == task.project_id,
                ProjectMember.user_id == current_user.id,
            )
            .first()
        )
        if not member or member.role != "manager":
            unauthorized.append(tid)
            continue

        task.active = False
        archived_tasks.append(tid)

    db.commit()
    return {
        "archived": archived_tasks,
        "unauthorized": unauthorized,
        "not_found": not_found,
    }


# Bulk Duplicate
@router.post("/bulk/duplicate", status_code=status.HTTP_201_CREATED)
def bulk_duplicate_tasks(
    task_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    duplicated, unauthorized, not_found = [], [], []

    for tid in task_ids:
        task = db.query(Task).filter(Task.id == tid).first()
        if not task:
            not_found.append(tid)
            continue

        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == task.project_id,
                ProjectMember.user_id == current_user.id,
            )
            .first()
        )
        if not member or member.role != "manager":
            unauthorized.append(tid)
            continue

        # Create the new task
        new_task = Task(
            name=f"{task.name} (Copy)",
            description=task.description,
            project_id=task.project_id,
            milestone_id=task.milestone_id,
            stage_id=task.stage_id,
            priority=task.priority,
            due_date=task.due_date,
            creator_id=current_user.id,
        )
        db.add(new_task)
        db.flush()  # so new_task.id is available

        # Duplicate assignees
        for assignee in task.assignees:
            new_task.assignees.append(assignee)

        duplicated.append(new_task.id)

    db.commit()

    return {
        "duplicated": duplicated,
        "unauthorized": unauthorized,
        "not_found": not_found,
    }


# -----------------------------
# Read one task
# -----------------------------
@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, task.project_id, current_user.id)
    return TaskOut.from_orm_with_assignees(task)


# Update task (creator, manager, or assignee)
# -----------------------------
@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    project = require_project_membership(db, task.project_id, current_user.id)

    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )

    # Check authorization
    # Check authorization
    is_creator = task.creator_id == current_user.id

    # Managers or project owners can edit
    is_manager = (
        membership and membership.role == "manager"
    ) or project.owner_id == current_user.id

    # Assignees can edit
    is_assignee = any(assignee.id == current_user.id for assignee in task.assignees)

    if not (is_creator or is_manager or is_assignee):
        raise HTTPException(
            status_code=403, detail="Not authorized to update this task"
        )

    # Apply updates
    for key, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return TaskOut.from_orm_with_assignees(task)


# Archive


@router.put("/{task_id}/archive", status_code=status.HTTP_200_OK)
def archive_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if not member or member.role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to archive this project. Only project managers can archive.",
        )

    task.active = False
    db.commit()
    db.refresh(task)
    return {"archived": task.id}


# Duplicate


@router.post("/{task_id}/duplicate", status_code=status.HTTP_201_CREATED)
def duplicate_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == task.project_id,
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
    # Create the new task
    new_task = Task(
        name=f"{task.name} (Copy)",
        description=task.description,
        project_id=task.project_id,
        milestone_id=task.milestone_id,
        stage_id=task.stage_id,
        priority=task.priority,
        due_date=task.due_date,
        creator_id=current_user.id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return {"duplicated": new_task.id}


# -----------------------------
@router.get("/{task_id}/tags", response_model=List[TagOut])
def get_task_tags(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check project membership
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )

    # Authorization checks
    is_creator = task.creator_id == current_user.id
    is_assignee = any(assignee.id == current_user.id for assignee in task.assignees)
    is_manager = (
        membership and membership.role == "member"
    ) or project.owner_id == current_user.id
    is_member = membership is not None

    if not (is_creator or is_assignee or is_manager or is_member):
        raise HTTPException(
            status_code=403, detail="Not authorized to view this task's tags"
        )

    return task.tags


# -----------------------------
# Delete task (creator or manager)
# -----------------------------
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    project = require_project_membership(db, task.project_id, current_user.id)

    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if task.creator_id != current_user.id and (
        not membership or membership.role != "manager"
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this task"
        )

    db.delete(task)
    db.commit()
    return None


# -----------------------------
# Create a subtask
# -----------------------------
@router.post(
    "/{task_id}/subtasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED
)
def create_subtask(
    task_id: int,
    subtask: TaskCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    parent_task = db.query(Task).filter(Task.id == task_id).first()
    if not parent_task:
        raise HTTPException(status_code=404, detail="Parent task not found")

    db_assignees = []
    if subtask.assignee_ids:
        db_assignees = db.query(Users).filter(Users.id.in_(subtask.assignee_ids)).all()

    new_subtask = Task(
        name=subtask.name,
        description=subtask.description,
        project_id=parent_task.project_id,
        milestone_id=subtask.milestone_id,
        stage_id=subtask.stage_id,
        priority=subtask.priority,
        due_date=subtask.due_date,
        assignees=db_assignees,
        creator_id=current_user.id,
        parent_task_id=parent_task.id,
    )

    project = require_project_membership(db, parent_task.project_id, current_user.id)

    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == current_user.id,
        )
        .first()
    )
    if parent_task.creator_id != current_user.id and (
        not membership or membership.role != "manager"
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to create this task"
        )

    db.add(new_subtask)
    db.commit()
    db.refresh(new_subtask)

    return TaskOut.from_orm_with_assignees(new_subtask)


# -----------------------------
# Get subtasks
# -----------------------------
@router.get("/{task_id}/subtasks", response_model=List[TaskOut])
def get_subtasks(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    parent_task = db.query(Task).filter(Task.id == task_id).first()
    if not parent_task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, parent_task.project_id, current_user.id)

    return db.query(Task).filter(Task.parent_task_id == task_id).all()


# -----------------------------
# Get messages/comments for a task
# -----------------------------
@router.get("/{task_id}/messages", response_model=List[MessageOut])
def get_task_messages(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, task.project_id, current_user.id)

    return (
        db.query(Message)
        .filter(Message.object_type == "task", Message.object_id == task_id)
        .order_by(Message.created_at.asc())
        .all()
    )


# -----------------------------
# Assign user to task
# -----------------------------
@router.post("/{task_id}/assign/{user_id}", status_code=status.HTTP_200_OK)
def assign_task(
    task_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, task.project_id, current_user.id)

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Optional: check that the target user is also a project member
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == user.id,
        )
        .first()
    )
    if not membership and task.project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="User must be a project member")

    if user not in task.assignees:
        task.assignees.append(user)
        db.commit()
        db.refresh(task)

    notification_service = NotificationService(db)
    notification_service.notify(
        user_id=user.id,
        notif_type="task",
        message=f"You’ve been assigned to task '{task.name}'",
        entity_type="Task",
        entity_id=task.id,
    )

    return {"message": f"User {user_id} assigned to task {task_id}"}


# -----------------------------
# Unassign user from task
# -----------------------------
@router.delete("/{task_id}/unassign/{user_id}", status_code=status.HTTP_200_OK)
def unassign_task(
    task_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, task.project_id, current_user.id)

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user in task.assignees:
        task.assignees.remove(user)
        db.commit()
        db.refresh(task)
        return {"message": f"User {user_id} unassigned from task {task_id}"}

    return {"message": f"User {user_id} was not assigned to task {task_id}"}
