import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True) # e.g. "INC-2026-0801"
    title = Column(String(200), nullable=False)
    severity = Column(String(20), default="high")         # critical, high, medium, low
    status = Column(String(30), default="active")         # active, investigating, identified, monitoring, resolved
    summary = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)                  # e.g. "Payment failure rate 1.2%, 1,420 checkout failures"
    root_cause = Column(Text, nullable=True)
    primary_service_id = Column(String(50), nullable=True)
    affected_services = Column(JSON, default=list)        # ["payment-service", "order-service"]
    lead_sre = Column(String(100), default="Sarah Chen (Lead SRE)")
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    timeline = Column(JSON, default=list)                 # list of {timestamp, message, author, type}

    # Relationships
    alerts = relationship("Alert", back_populates="incident")
