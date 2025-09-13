from sqlalchemy import Column, String, Text
from sqlalchemy.orm import declarative_base, Session
from app.db.session import SessionLocal

# create a fresh Base to avoid loading all other models
Base = declarative_base()


class Role(Base):
    __tablename__ = "roles"
    name = Column(String, primary_key=True)
    description = Column(Text)


def seed_roles(db: Session):
    default_roles = [
        {"name": "admin", "description": "Administrator with full access"},
        {"name": "user", "description": "Default role for normal users"},
    ]
    for r in default_roles:
        if not db.query(Role).filter_by(name=r["name"]).first():
            db.add(Role(**r))
    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_roles(db)
        print("✅ Roles seeded successfully")
    finally:
        db.close()
