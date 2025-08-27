from math import ceil
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.schemas.notification_schema import NotificationOut
from app.db.schemas.pagination.pagination_schema import PaginatedResponse
from ....models.notification import Notification
from ....models.users import Users
from ....db.session import get_db
from ....services.auth_service import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=PaginatedResponse[NotificationOut])
def get_notifications(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    offset = (page - 1) * limit

    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = query.count()

    notifications = (
        query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    )

    return PaginatedResponse[NotificationOut](
        items=notifications,
        total=total,
        page=page,
        limit=limit,
        pages=ceil(total / limit),
        has_next=page * limit < total,
    )


# Get a specific notification (and mark as read)
@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id, Notification.user_id == current_user.id
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


# Mark all as read
@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"msg": "All notifications marked as read"}


# Delete a notification
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id, Notification.user_id == current_user.id
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notif)
    db.commit()
    return {"msg": "Notification deleted"}
