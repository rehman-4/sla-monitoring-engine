from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MonitorBase(BaseModel):
    name: str
    service_id: str
    metric_type: str # availability, latency_p95, error_rate, cpu_percent
    condition: str # lt, gt, lte, gte
    warning_threshold: float
    critical_threshold: float
    evaluation_window_minutes: int = 5
    severity: str = "warning" # critical, warning, info
    is_enabled: bool = True
    notification_channel: str = "#sre-oncall, pagerduty"
    description: Optional[str] = None

class MonitorCreate(MonitorBase):
    pass

class MonitorUpdate(BaseModel):
    name: Optional[str] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    evaluation_window_minutes: Optional[int] = None
    severity: Optional[str] = None
    is_enabled: Optional[bool] = None
    notification_channel: Optional[str] = None
    description: Optional[str] = None

class MonitorRead(MonitorBase):
    id: str
    service_name: Optional[str] = None
    current_value: Optional[float] = None
    status: str # OK, WARNING, CRITICAL, DISABLED
    created_at: datetime

    class Config:
        from_attributes = True
