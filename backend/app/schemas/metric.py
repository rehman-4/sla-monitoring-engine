from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class MetricPoint(BaseModel):
    timestamp: datetime
    requests_per_sec: float
    error_rate: float
    p50_latency: float
    p95_latency: float
    p99_latency: float
    availability: float
    cpu_percent: float
    memory_percent: float

    class Config:
        from_attributes = True

class MetricQueryResponse(BaseModel):
    service_id: str
    service_name: str
    time_range: str
    points: List[MetricPoint]
    summary: Dict[str, float] # avg_rps, avg_error_rate, avg_p95, avg_availability, min_p95, max_p95
