from fastapi import FastAPI
from app.api.v1.auth import auth
from app.api.v1.chat import message
from app.api.v1.project import project
from app.api.v1.project import task
from app.api.v1.project import tag
from app.api.v1.notification import notification
from app.api.v1.user import user_profile
from app.db.session import Base, engine


app = FastAPI()
Base.metadata.create_all(bind=engine)


@app.get("/healthy")
def health_check():
    return {"status": "Healthy"}


app.include_router(auth.router)
app.include_router(user_profile.router)
app.include_router(message.router)
app.include_router(project.router)
app.include_router(task.router)
app.include_router(tag.router)
app.include_router(notification.router)
