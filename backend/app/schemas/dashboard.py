from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DashboardBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_default: bool = False
    tags: List[str] = []
    layout_config: List[Dict[str, Any]] = []

class DashboardCreate(DashboardBase):
    pass

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    layout_config: Optional[List[Dict[str, Any]]] = None

class DashboardRead(DashboardBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotificationRead(BaseModel):
    id: str
    title: str
    message: str
    type: str
    severity: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class GlobalSearchItem(BaseModel):
    id: str
    type: str # service, alert, incident, slo, sla, monitor, log
    title: str
    subtitle: str
    status: Optional[str] = None
    url: str

class OverviewKPIs(BaseModel):
    system_health_status: str # healthy, warning, critical
    system_health_score: float # e.g. 99.95%
    availability: float
    availability_target: float
    slo_compliance_percent: float
    sla_compliance_percent: float
    error_budget_remaining_percent: float
    active_incidents_count: int
    active_alerts_count: int
    total_services_count: int
    healthy_services_count: int
    sparklines: Dict[str, List[float]] # sparklines for health, avail, slo, budget
