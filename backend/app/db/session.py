# app/db/session.py
from sqlalchemy import NullPool, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# Create engine
# Production DB
# engine = create_engine(settings.DATABASE_URL, echo=True)
# --BREAK--
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=NullPool
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base model class
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
