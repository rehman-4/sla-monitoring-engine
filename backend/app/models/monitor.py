import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Monitor(Base):
    __tablename__ = "monitors"

    id = Column(String(50), primary_key=True, index=True) # e.g. "mon-api-avail"
    name = Column(String(150), nullable=False)
    service_id = Column(String(50), ForeignKey("services.id"), nullable=False)
    metric_type = Column(String(50), nullable=False)      # availability, latency_p95, error_rate, cpu_percent
    condition = Column(String(10), nullable=False)        # lt, gt, lte, gte
    warning_threshold = Column(Float, nullable=False)
    critical_threshold = Column(Float, nullable=False)
    evaluation_window_minutes = Column(Integer, default=5)
    severity = Column(String(20), default="warning")      # critical, warning, info
    is_enabled = Column(Boolean, default=True)
    notification_channel = Column(String(100), default="#sre-oncall, pagerduty")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    service = relationship("Service", back_populates="monitors")
    alerts = relationship("Alert", back_populates="monitor")
