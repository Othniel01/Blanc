# app/api/routes/message.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....db.session import get_db
from ....models.message import Message
from ....db.schemas.chat.message_schema import MessageCreate, MessageUpdate, MessageOut
from ....models.users import Users
from ....services.auth_service import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


# Create a message (comment/chat/audit)
@router.post("/", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication failed")

    new_message = Message(
        object_type=message.object_type,
        object_id=message.object_id,
        content=message.content,
        message_type=message.message_type,
        author_id=current_user.id,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


# Get messages for a given record (task/project/etc.)
@router.get(
    "/{object_type}/{object_id}",
    response_model=list[MessageOut],
    status_code=status.HTTP_200_OK,
)
def get_messages(
    object_type: str,
    object_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication failed")

    messages = (
        db.query(Message)
        .filter(Message.object_type == object_type, Message.object_id == object_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages


# Update a message (only author can update)
@router.put("/{message_id}", response_model=MessageOut, status_code=status.HTTP_200_OK)
def update_message(
    message_id: int,
    message_update: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication failed")

    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You are not allowed to edit this message"
        )

    message.content = message_update.content
    db.commit()
    db.refresh(message)
    return message


# Delete a message (only author can delete)
@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication failed")

    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.author_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You are not allowed to delete this message"
        )

    db.delete(message)
    db.commit()
    return None
