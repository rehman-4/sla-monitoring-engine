from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.log_trace import Trace, TraceSpan
from app.models.service import Service
from app.schemas.log_trace import TraceRead, TraceSpanRead

router = APIRouter()

@router.get("", response_model=List[TraceRead])
def list_traces(
    service_id: Optional[str] = Query(None),
    has_error: Optional[bool] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    q = db.query(Trace).order_by(Trace.timestamp.desc())
    if service_id:
        q = q.filter(Trace.root_service_id == service_id)
    if has_error is not None:
        q = q.filter(Trace.has_error == has_error)

    traces = q.limit(limit).all()
    results = []

    # Map service IDs to names
    services = {s.id: s.name for s in db.query(Service).all()}

    for t in traces:
        spans_read = [
            TraceSpanRead(
                id=sp.id,
                trace_id=sp.trace_id,
                parent_span_id=sp.parent_span_id,
                service_id=sp.service_id,
                service_name=services.get(sp.service_id, sp.service_id),
                span_name=sp.span_name,
                start_offset_ms=sp.start_offset_ms,
                duration_ms=sp.duration_ms,
                status=sp.status,
                error_message=sp.error_message,
                tags=sp.tags or {}
            )
            for sp in t.spans
        ]

        results.append(TraceRead(
            id=t.id,
            root_service_id=t.root_service_id,
            root_service_name=services.get(t.root_service_id, t.root_service_id),
            operation_name=t.operation_name,
            timestamp=t.timestamp,
            total_duration_ms=t.total_duration_ms,
            http_status=t.http_status,
            has_error=t.has_error,
            user_id=t.user_id,
            spans=spans_read
        ))

    return results

@router.get("/{trace_id}", response_model=TraceRead)
def get_trace(trace_id: str, db: Session = Depends(get_db)):
    t = db.query(Trace).filter(Trace.id == trace_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trace not found")

    services = {s.id: s.name for s in db.query(Service).all()}

    spans_read = [
        TraceSpanRead(
            id=sp.id,
            trace_id=sp.trace_id,
            parent_span_id=sp.parent_span_id,
            service_id=sp.service_id,
            service_name=services.get(sp.service_id, sp.service_id),
            span_name=sp.span_name,
            start_offset_ms=sp.start_offset_ms,
            duration_ms=sp.duration_ms,
            status=sp.status,
            error_message=sp.error_message,
            tags=sp.tags or {}
        )
        for sp in t.spans
    ]

    return TraceRead(
        id=t.id,
        root_service_id=t.root_service_id,
        root_service_name=services.get(t.root_service_id, t.root_service_id),
        operation_name=t.operation_name,
        timestamp=t.timestamp,
        total_duration_ms=t.total_duration_ms,
        http_status=t.http_status,
        has_error=t.has_error,
        user_id=t.user_id,
        spans=spans_read
    )
