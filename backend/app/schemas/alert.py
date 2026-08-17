from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    service_id: str
    monitor_id: Optional[str] = None
    slo_id: Optional[str] = None
    severity: str # critical, warning, info
    title: str
    description: Optional[str] = None
    metric_type: str
    current_value: float
    threshold_value: float

class AlertCreate(AlertBase):
    pass

class AlertAcknowledge(BaseModel):
    acknowledged_by: str = "SRE Engineer"

class AlertRead(AlertBase):
    id: str
    status: str # open, acknowledged, resolved
    started_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    incident_id: Optional[str] = None
    service_name: Optional[str] = None
    duration_minutes: Optional[int] = None

    class Config:
        from_attributes = True
