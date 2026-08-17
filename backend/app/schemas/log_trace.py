from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class LogEntryRead(BaseModel):
    id: str
    service_id: str
    service_name: Optional[str] = None
    timestamp: datetime
    level: str # INFO, WARN, ERROR, CRITICAL
    message: str
    request_id: Optional[str] = None
    http_method: str
    http_status: int
    duration_ms: float
    metadata_json: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class TraceSpanRead(BaseModel):
    id: str
    trace_id: str
    parent_span_id: Optional[str] = None
    service_id: str
    service_name: Optional[str] = None
    span_name: str
    start_offset_ms: float
    duration_ms: float
    status: str
    error_message: Optional[str] = None
    tags: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class TraceRead(BaseModel):
    id: str
    root_service_id: str
    root_service_name: Optional[str] = None
    operation_name: str
    timestamp: datetime
    total_duration_ms: float
    http_status: int
    has_error: bool
    user_id: Optional[str] = None
    spans: List[TraceSpanRead] = []

    class Config:
        from_attributes = True
