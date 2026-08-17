from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SLOBase(BaseModel):
    name: str
    service_id: str
    metric_type: str # availability, latency_p95, error_rate
    target_percentage: float # e.g. 99.90
    target_value: Optional[float] = None # e.g. 200 (ms)
    time_window_days: int = 30
    warning_threshold: float = 99.92
    critical_threshold: float = 99.90
    description: Optional[str] = None
    is_active: bool = True

class SLOCreate(SLOBase):
    pass

class SLOUpdate(BaseModel):
    name: Optional[str] = None
    target_percentage: Optional[float] = None
    target_value: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SLORead(SLOBase):
    id: str
    created_at: datetime
    service_name: Optional[str] = None
    current_compliance: float
    current_value_formatted: str
    status: str # PASS, WARNING, BREACHED
    error_budget_total_percent: float # e.g. 0.10%
    error_budget_consumed_percent: float # e.g. 0.04%
    error_budget_remaining_percent: float # e.g. 60.0%
    burn_rate_1h: float
    burn_rate_6h: float
    burn_rate_24h: float

    class Config:
        from_attributes = True

class ErrorBudgetOverview(BaseModel):
    service_id: str
    service_name: str
    slo_id: str
    slo_name: str
    allowed_budget_percent: float
    consumed_budget_percent: float
    remaining_budget_percent: float
    budget_used_percentage: float # 0 to 100%
    burn_rate_1h: float
    burn_rate_6h: float
    burn_rate_24h: float
    status: str # healthy, warning, critical
