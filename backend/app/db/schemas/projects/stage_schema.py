from pydantic import BaseModel


class StageBase(BaseModel):
    name: str
    sequence: int = 0


class StageCreate(StageBase):
    pass


class StageOut(StageBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True
