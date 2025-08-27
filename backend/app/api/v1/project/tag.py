from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....db.session import get_db
from ....models.project import Tag, Project, project_tags
from ....models.tasks import Task, task_tags
from ....models.users import Users
from ....services.auth_service import get_current_user
from ....db.schemas.projects.tag_schema import TagCreate, TagUpdate, TagOut

router = APIRouter(prefix="/tags", tags=["Tags"])


# -----------------------------
# Create a tag
# -----------------------------
@router.post("/", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    existing = db.query(Tag).filter(Tag.name == tag.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    new_tag = Tag(name=tag.name, color=tag.color)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag


# -----------------------------
# Get all tags
# -----------------------------
@router.get("/", response_model=List[TagOut])
def get_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()


# -----------------------------
# Update a tag
# -----------------------------
@router.put("/{tag_id}", response_model=TagOut)
def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    for key, value in tag_update.model_dump(exclude_unset=True).items():
        setattr(tag, key, value)

    db.commit()
    db.refresh(tag)
    return tag


# -----------------------------
# Delete a tag
# -----------------------------
@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
    return None


# -----------------------------
# Assign tag to a project
# -----------------------------
@router.post("/project/{project_id}/assign/{tag_id}", status_code=status.HTTP_200_OK)
def assign_tag_to_project(
    project_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not project or not tag:
        raise HTTPException(status_code=404, detail="Project or Tag not found")

    if tag not in project.tags:
        project.tags.append(tag)
        db.commit()

    return {"message": f"Tag {tag_id} assigned to project {project_id}"}


# -----------------------------
# Unassign tag from project
# -----------------------------
@router.delete(
    "/project/{project_id}/unassign/{tag_id}", status_code=status.HTTP_200_OK
)
def unassign_tag_from_project(
    project_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not project or not tag:
        raise HTTPException(status_code=404, detail="Project or Tag not found")

    if tag in project.tags:
        project.tags.remove(tag)
        db.commit()

    return {"message": f"Tag {tag_id} unassigned from project {project_id}"}


# -----------------------------
# Assign tag to a task
# -----------------------------
@router.post("/task/{task_id}/assign/{tag_id}", status_code=status.HTTP_200_OK)
def assign_tag_to_task(
    task_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not task or not tag:
        raise HTTPException(status_code=404, detail="Task or Tag not found")

    if tag not in task.tags:
        task.tags.append(tag)
        db.commit()

    return {"message": f"Tag {tag_id} assigned to task {task_id}"}


# -----------------------------
# Unassign tag from task
# -----------------------------
@router.delete("/task/{task_id}/unassign/{tag_id}", status_code=status.HTTP_200_OK)
def unassign_tag_from_task(
    task_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not task or not tag:
        raise HTTPException(status_code=404, detail="Task or Tag not found")

    if tag in task.tags:
        task.tags.remove(tag)
        db.commit()

    return {"message": f"Tag {tag_id} unassigned from task {task_id}"}
