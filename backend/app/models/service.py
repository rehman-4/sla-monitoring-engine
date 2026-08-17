import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(String(50), primary_key=True, index=True) # e.g. "shopcloud-api"
    name = Column(String(100), nullable=False)             # e.g. "ShopCloud API"
    slug = Column(String(100), unique=True, index=True)
    tier = Column(String(20), default="tier-1")            # tier-1 (critical), tier-2, tier-3
    status = Column(String(20), default="healthy")         # healthy, warning, critical, unknown
    description = Column(Text, nullable=True)
    owner_team = Column(String(100), default="Core Platform")
    environment = Column(String(50), default="production")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    metrics = relationship("Metric", back_populates="service", cascade="all, delete-orphan")
    slos = relationship("SLO", back_populates="service", cascade="all, delete-orphan")
    slas = relationship("SLA", back_populates="service", cascade="all, delete-orphan")
    monitors = relationship("Monitor", back_populates="service", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="service", cascade="all, delete-orphan")
    logs = relationship("LogEntry", back_populates="service", cascade="all, delete-orphan")

    outgoing_dependencies = relationship(
        "ServiceDependency",
        foreign_keys="ServiceDependency.source_service_id",
        back_populates="source_service",
        cascade="all, delete-orphan"
    )
    incoming_dependencies = relationship(
        "ServiceDependency",
        foreign_keys="ServiceDependency.target_service_id",
        back_populates="target_service",
        cascade="all, delete-orphan"
    )

class ServiceDependency(Base):
    __tablename__ = "service_dependencies"

    id = Column(String(50), primary_key=True)
    source_service_id = Column(String(50), ForeignKey("services.id"), nullable=False)
    target_service_id = Column(String(50), ForeignKey("services.id"), nullable=False)
    call_type = Column(String(50), default="sync_http") # sync_http, async_queue, grpc
    avg_latency_ms = Column(Float, default=15.0)

    source_service = relationship("Service", foreign_keys=[source_service_id], back_populates="outgoing_dependencies")
    target_service = relationship("Service", foreign_keys=[target_service_id], back_populates="incoming_dependencies")
