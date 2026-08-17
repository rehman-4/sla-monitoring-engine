from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.models.log_trace import LogEntry
from app.schemas.log_trace import LogEntryRead

router = APIRouter()

@router.get("", response_model=List[LogEntryRead])
def search_logs(
    service_id: Optional[str] = Query(None, description="Filter by service ID"),
    level: Optional[str] = Query(None, description="Filter by log level: INFO, WARN, ERROR, CRITICAL"),
    query: Optional[str] = Query(None, description="Search query string"),
    request_id: Optional[str] = Query(None, description="Filter by request correlation ID"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    q = db.query(LogEntry).order_by(LogEntry.timestamp.desc())

    if service_id:
        q = q.filter(LogEntry.service_id == service_id)
    if level:
        q = q.filter(LogEntry.level == level.upper())
    if request_id:
        q = q.filter(LogEntry.request_id == request_id)
    if query:
        q = q.filter(
            or_(
                LogEntry.message.ilike(f"%{query}%"),
                LogEntry.request_id.ilike(f"%{query}%")
            )
        )

    logs = q.offset(offset).limit(limit).all()

    return [
        LogEntryRead(
            id=l.id,
            service_id=l.service_id,
            service_name=l.service.name if l.service else l.service_id,
            timestamp=l.timestamp,
            level=l.level,
            message=l.message,
            request_id=l.request_id,
            http_method=l.http_method,
            http_status=l.http_status,
            duration_ms=l.duration_ms,
            metadata_json=l.metadata_json or {}
        )
        for l in logs
    ]
