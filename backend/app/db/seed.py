# app/db/seed.py  Seed this file

from sqlalchemy.orm import Session
from app.models.roles import Role
from app.db.session import SessionLocal, Base, engine


def seed_roles(db: Session):
    default_roles = [
        {"name": "admin", "description": "Administrator with full access"},
        {"name": "user", "description": "Default role for normal users"},
    ]

    for role in default_roles:
        existing = db.query(Role).filter_by(name=role["name"]).first()
        if not existing:
            db.add(Role(**role))
    db.commit()


if __name__ == "__main__":
    # Create tables if they don’t exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_roles(db)
        print("✅ Roles seeded successfully")
    finally:
        db.close()
