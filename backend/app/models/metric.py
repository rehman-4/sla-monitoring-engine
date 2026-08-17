import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.database import Base

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(String(50), ForeignKey("services.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    
    # Core SLI telemetry
    requests_per_sec = Column(Float, default=0.0)
    error_rate = Column(Float, default=0.0)          # percentage, e.g. 0.05%
    p50_latency = Column(Float, default=0.0)         # ms
    p95_latency = Column(Float, default=0.0)         # ms
    p99_latency = Column(Float, default=0.0)         # ms
    availability = Column(Float, default=100.0)      # percentage, e.g. 99.95%
    
    # System / Infra telemetry
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)

    # Relationships
    service = relationship("Service", back_populates="metrics")

    __table_args__ = (
        Index("ix_metrics_service_time", "service_id", "timestamp"),
    )
