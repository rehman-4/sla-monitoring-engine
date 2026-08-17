from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SLABase(BaseModel):
    name: str
    service_id: str
    customer_tier: str = "Enterprise"
    metric_type: str = "availability"
    target_percentage: float = 99.50
    target_value: Optional[float] = None
    penalty_terms: Optional[str] = None

class SLACreate(SLABase):
    pass

class SLAUpdate(BaseModel):
    name: Optional[str] = None
    customer_tier: Optional[str] = None
    target_percentage: Optional[float] = None
    penalty_terms: Optional[str] = None

class SLARead(SLABase):
    id: str
    service_name: Optional[str] = None
    current_compliance: float
    status: str # Compliant, At Risk, Breached
    penalty_risk: str # None, Low, High, Triggered
    created_at: datetime

    class Config:
        from_attributes = True
