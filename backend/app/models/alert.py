import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True) # e.g. "alt-2026-0801"
    monitor_id = Column(String(50), ForeignKey("monitors.id"), nullable=True)
    service_id = Column(String(50), ForeignKey("services.id"), nullable=False)
    slo_id = Column(String(50), ForeignKey("slos.id"), nullable=True)
    severity = Column(String(20), default="warning")      # critical, warning, info
    status = Column(String(30), default="open")           # open, acknowledged, resolved
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    metric_type = Column(String(50), nullable=False)
    current_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True)

    # Relationships
    service = relationship("Service", back_populates="alerts")
    monitor = relationship("Monitor", back_populates="alerts")
    slo = relationship("SLO", back_populates="alerts")
    incident = relationship("Incident", back_populates="alerts")
