# app/api/routes/task.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from app.db.schemas.chat.message_schema import MessageOut
from app.db.schemas.projects.sub_task import SubTaskCreate, SubTaskOut, SubTaskUpdate
from app.db.schemas.projects.tag_schema import TagOut
from app.db.schemas.user_profile_schema import UserProfileResponse
from app.services.notification_service import NotificationService
from ....db.session import get_db
from ....models.tasks import SubTask, Task, TaskStatusEnum
from ....db.schemas.projects.task_schema import TaskCreate, TaskUpdate, TaskOut
from ....models.users import Users
from ....services.auth_service import get_current_user
from ....models.message import Message
from ....models.project import Project, ProjectMember, Stage, Tag

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

    stage_id = task.stage_id
    if stage_id:

        stage = (
            db.query(Stage)
            .filter(Stage.id == stage_id, Stage.project_id == task.project_id)
            .first()
        )
        if not stage:
            raise HTTPException(
                status_code=400,
                detail="Invalid stage_id: Stage does not belong to this project",
            )
    else:
        # Fallback to default stage
        stage = (
            db.query(Stage)
            .filter(Stage.project_id == task.project_id, Stage.is_default == True)
            .first()
        )
        if not stage:
            raise HTTPException(
                status_code=400, detail="No default stage found for this project"
            )
        stage_id = stage.id

    db_assignees = []
    if task.assignee_ids:
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
        stage_id=stage_id,
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
@router.get("/", response_model=List[TaskOut])
def get_tasks(
    project_id: Optional[int] = Query(None),
    archived: Optional[bool] = Query(None),
    open_only: bool = Query(False),
    created_by_me: bool = Query(False),
    assigned_to_me: bool = Query(False),
    due_before: Optional[date] = Query(None),
    due_after: Optional[date] = Query(None),
    tags: Optional[List[str]] = Query(None),
    order_by: Optional[str] = Query(
        None, description="Sort field, prefix with '-' for descending"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    query = db.query(Task)

    # Scope
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

    # Archived
    if archived is True:
        query = query.filter(Task.active == False)
    elif archived is False:
        query = query.filter(Task.active == True)

    # Open = active & not done
    if open_only:
        query = query.filter(
            Task.active == True,
            Task.status.in_(
                [
                    TaskStatusEnum.in_progress,
                    TaskStatusEnum.changes_requested,
                    TaskStatusEnum.approved,
                ]
            ),
        )

    # Created by current user
    if created_by_me:
        query = query.filter(Task.creator_id == current_user.id)

    # Assigned to current user
    if assigned_to_me:
        query = query.join(Task.assignees).filter(Users.id == current_user.id)

    # Due dates
    if due_before:
        query = query.filter(Task.due_date <= due_before)
    if due_after:
        query = query.filter(Task.due_date >= due_after)

    # Tags
    if tags:
        query = query.join(Task.tags).filter(Tag.name.in_(tags)).distinct()

    # Sorting
    if order_by:
        desc_order = order_by.startswith("-")
        field_name = order_by.lstrip("-")

        sort_map = {
            "due_date": Task.due_date,
            "priority": Task.priority,
            "created_at": Task.created_at,
            "updated_at": Task.updated_at,
            "name": Task.name,
        }

        if field_name in sort_map:
            query = query.order_by(
                desc(sort_map[field_name]) if desc_order else asc(sort_map[field_name])
            )

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


@router.get("/message-counts", response_model=Dict[int, int])
def message_counts(
    task_ids: List[int] = Query(...),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    """
    Returns a dict of {task_id: message_count} for the given list of task_ids
    """
    # Query messages grouped by object_id where object_type is "task"
    counts = (
        db.query(Message.object_id, func.count(Message.id))
        .filter(Message.object_type == "task", Message.object_id.in_(task_ids))
        .group_by(Message.object_id)
        .all()
    )

    # Convert to dict and ensure all task_ids are present
    counts_dict = {tid: 0 for tid in task_ids}  # default 0
    for object_id, count in counts:
        counts_dict[object_id] = count

    return counts_dict


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


# Get path task
@router.get("/projects/{project_id}/tasks/{task_id}", response_model=TaskOut)
def get_task_in_project(
    project_id: int = Path(..., description="ID of the project"),
    task_id: int = Path(..., description="ID of the task"),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    require_project_membership(db, project_id, current_user.id)

    task = (
        db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found in this project")

    return TaskOut.from_orm_with_assignees(task)


# -----------------------------
# Read one task
# -----------------------------
@router.get("/{task_id}", response_model=TaskOut)
def get_task_by_id(
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


@router.patch("/{task_id}/stage")
def move_task_stage(task_id: int, stage_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    stage = db.query(Stage).filter(Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    task.stage_id = stage_id
    db.commit()
    db.refresh(task)
    return {"ok": True, "task_id": task.id, "new_stage": stage_id}


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
# Create Subtask
# -----------------------------


@router.post(
    "/{task_id}/subtasks",
    response_model=SubTaskOut,
    status_code=status.HTTP_201_CREATED,
)
def create_subtask(
    task_id: int,
    subtask: SubTaskCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, task.project_id, current_user.id)

    new_subtask = SubTask(
        title=subtask.title,
        is_done=subtask.is_done,
        task_id=task.id,
        owner_id=current_user.id,
    )

    db.add(new_subtask)
    db.commit()
    db.refresh(new_subtask)

    return new_subtask


@router.get("/{task_id}/subtasks", response_model=List[SubTaskOut])
def get_subtasks(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    require_project_membership(db, task.project_id, current_user.id)

    return db.query(SubTask).filter(SubTask.task_id == task_id).all()


@router.put("/{task_id}/subtasks/{subtask_id}", response_model=SubTaskOut)
def update_subtask(
    task_id: int,
    subtask_id: int,
    subtask_update: SubTaskUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    subtask = (
        db.query(SubTask)
        .filter(SubTask.id == subtask_id, SubTask.task_id == task_id)
        .first()
    )
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    require_project_membership(db, subtask.task.project_id, current_user.id)

    if subtask_update.title is not None:
        subtask.title = subtask_update.title
    if subtask_update.is_done is not None:
        subtask.is_done = subtask_update.is_done

    db.commit()
    db.refresh(subtask)

    return subtask


@router.delete(
    "/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_subtask(
    task_id: int,
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    subtask = (
        db.query(SubTask)
        .filter(SubTask.id == subtask_id, SubTask.task_id == task_id)
        .first()
    )
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    require_project_membership(db, subtask.task.project_id, current_user.id)

    db.delete(subtask)
    db.commit()

    return


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

    # Ensure the current user is a project member (permission check)
    require_project_membership(db, task.project_id, current_user.id)

    # Check if the target user exists
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Ensure the target user is a member of the project
    membership = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == task.project_id,
            ProjectMember.user_id == user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=403, detail="User must be a project member to be assigned"
        )

    # Assign the user if not already assigned
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


# Get  assignees
@router.get("/{task_id}/assignees", response_model=List[UserProfileResponse])
def get_task_assignees(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Ensure requester has access to the project
    require_project_membership(db, task.project_id, current_user.id)

    # Return assignees with profile info
    return [UserProfileResponse.model_validate(user) for user in task.assignees]


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
