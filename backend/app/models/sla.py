import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class SLA(Base):
    __tablename__ = "slas"

    id = Column(String(50), primary_key=True, index=True) # e.g. "sla-enterprise-avail"
    name = Column(String(150), nullable=False)            # e.g. "Enterprise Customer SLA"
    service_id = Column(String(50), ForeignKey("services.id"), nullable=False)
    customer_tier = Column(String(50), default="Enterprise") # Enterprise, Business, Standard
    metric_type = Column(String(50), default="availability") # availability, latency_p95
    target_percentage = Column(Float, nullable=False)     # e.g. 99.50%
    target_value = Column(Float, nullable=True)           # e.g. 500 (ms)
    current_compliance = Column(Float, default=99.95)     # calculated real-time
    status = Column(String(30), default="Compliant")      # Compliant, At Risk, Breached
    penalty_terms = Column(Text, nullable=True)           # e.g. "10% service credit for downtime > 0.5%"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    service = relationship("Service", back_populates="slas")
