from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.dashboard import Notification
from app.schemas.dashboard import NotificationRead

router = APIRouter()

@router.get("", response_model=List[NotificationRead])
def list_notifications(db: Session = Depends(get_db)):
    notes = db.query(Notification).order_by(Notification.created_at.desc()).limit(30).all()
    return [
        NotificationRead(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            severity=n.severity,
            link=n.link,
            is_read=n.is_read,
            created_at=n.created_at
        )
        for n in notes
    ]

@router.post("/{notification_id}/read")
def mark_read(notification_id: str, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"status": "success", "id": notification_id}

@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}
