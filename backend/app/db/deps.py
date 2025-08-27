from fastapi import Depends
from typing import Annotated
from sqlalchemy.orm import Session
from ..db.session import get_db


db_dependency = Annotated[Session, Depends(get_db)]
