from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.project import Stage, Project
from app.db.schemas.stage import StageCreate, StageUpdate, StageOut
from app.models.users import Users
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/projects/{project_id}/stages", tags=["Stages"])


# Create stage
@router.post("/", response_model=StageOut)
def create_stage(
    project_id: int,
    stage_in: StageCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    stage = Stage(**stage_in.model_dump(), project_id=project_id)
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


# List stages
@router.get("/", response_model=list[StageOut])
def list_stages(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    return (
        db.query(Stage)
        .filter(Stage.project_id == project_id)
        .order_by(Stage.sequence)
        .all()
    )


# Update stage
@router.patch("/{stage_id}", response_model=StageOut)
def update_stage(
    project_id: int,
    stage_id: int,
    stage_in: StageUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    stage = (
        db.query(Stage)
        .filter(Stage.id == stage_id, Stage.project_id == project_id)
        .first()
    )
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    for key, value in stage_in.model_dump(exclude_unset=True).items():
        setattr(stage, key, value)

    db.commit()
    db.refresh(stage)
    return stage


# Delete stage
@router.delete("/{stage_id}")
def delete_stage(
    project_id: int,
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    stage = (
        db.query(Stage)
        .filter(Stage.id == stage_id, Stage.project_id == project_id)
        .first()
    )
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    if stage.is_default:
        raise HTTPException(status_code=400, detail="Default stage cannot be deleted")

    default_stage = (
        db.query(Stage)
        .filter(Stage.project_id == project_id, Stage.is_default == True)
        .first()
    )
    if not default_stage:
        raise HTTPException(status_code=400, detail="Default stage not found")

    for task in stage.tasks:
        task.stage_id = default_stage.id

    db.delete(stage)
    db.commit()
    return {"ok": True}
