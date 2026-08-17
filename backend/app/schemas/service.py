from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ServiceDependencyBase(BaseModel):
    id: str
    source_service_id: str
    target_service_id: str
    call_type: str
    avg_latency_ms: float

class ServiceDependencyRead(ServiceDependencyBase):
    class Config:
        from_attributes = True

class ServiceBase(BaseModel):
    id: str
    name: str
    slug: str
    tier: str
    status: str
    description: Optional[str] = None
    owner_team: str
    environment: str

class ServiceCreate(BaseModel):
    name: str
    tier: str = "tier-2"
    description: Optional[str] = None
    owner_team: str = "Engineering"
    environment: str = "production"

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    tier: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    owner_team: Optional[str] = None

class ServiceRead(ServiceBase):
    created_at: datetime
    availability: Optional[float] = None
    requests_per_sec: Optional[float] = None
    error_rate: Optional[float] = None
    p50_latency: Optional[float] = None
    p95_latency: Optional[float] = None
    p99_latency: Optional[float] = None
    active_alerts_count: Optional[int] = 0
    active_slos_count: Optional[int] = 0
    error_budget_remaining: Optional[float] = None

    class Config:
        from_attributes = True

class ServiceTopologyNode(BaseModel):
    id: str
    name: str
    tier: str
    status: str
    availability: float
    requests_per_sec: float
    p95_latency: float
    error_rate: float
    error_budget_remaining: float
    active_alerts: int
    x: Optional[float] = None
    y: Optional[float] = None

class ServiceTopologyEdge(BaseModel):
    id: str
    source: str
    target: str
    call_type: str
    avg_latency_ms: float

class ServiceTopology(BaseModel):
    nodes: List[ServiceTopologyNode]
    edges: List[ServiceTopologyEdge]
