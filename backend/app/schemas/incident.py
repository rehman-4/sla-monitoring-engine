from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class IncidentTimelineEvent(BaseModel):
    timestamp: str
    message: str
    author: str
    type: str # status_change, note, metric_alert, action_item

class IncidentBase(BaseModel):
    title: str
    severity: str = "high" # critical, high, medium, low
    summary: Optional[str] = None
    impact: Optional[str] = None
    root_cause: Optional[str] = None
    primary_service_id: Optional[str] = None
    affected_services: List[str] = []
    lead_sre: str = "Sarah Chen (Lead SRE)"

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    summary: Optional[str] = None
    impact: Optional[str] = None
    root_cause: Optional[str] = None
    lead_sre: Optional[str] = None

class IncidentAddEvent(BaseModel):
    message: str
    author: str = "SRE On-Call"
    type: str = "note"

class IncidentRead(IncidentBase):
    id: str
    status: str # active, investigating, identified, monitoring, resolved
    started_at: datetime
    resolved_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    timeline: List[Dict[str, Any]] = []
    alerts_count: int = 0

    class Config:
        from_attributes = True
