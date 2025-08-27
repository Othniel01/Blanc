from ..db.session import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    # backref to users
    users = relationship("Users", back_populates="role")
