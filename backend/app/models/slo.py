import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class SLO(Base):
    __tablename__ = "slos"

    id = Column(String(50), primary_key=True, index=True) # e.g. "slo-shopcloud-api-avail"
    name = Column(String(150), nullable=False)            # e.g. "API Availability (99.90%)"
    service_id = Column(String(50), ForeignKey("services.id"), nullable=False)
    metric_type = Column(String(50), nullable=False)      # availability, latency_p95, error_rate
    target_percentage = Column(Float, nullable=False)     # e.g. 99.90%
    target_value = Column(Float, nullable=True)           # e.g. 200 (ms) for latency
    time_window_days = Column(Integer, default=30)        # 30-day rolling window
    warning_threshold = Column(Float, default=99.92)      # Warn before breach
    critical_threshold = Column(Float, default=99.90)     # Breach limit
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    service = relationship("Service", back_populates="slos")
    alerts = relationship("Alert", back_populates="slo")
