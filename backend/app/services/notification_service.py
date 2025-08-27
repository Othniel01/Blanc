from sqlalchemy.orm import Session
from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def notify(
        self,
        user_id: int,
        notif_type: str,
        message: str,
        entity_type: str = None,
        entity_id: int = None,
    ):
        notif = Notification(
            user_id=user_id,
            type=notif_type,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif
