import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, JSON, Index
from sqlalchemy.orm import relationship
from app.db.database import Base

class LogEntry(Base):
    __tablename__ = "logs"

    id = Column(String(50), primary_key=True, index=True) # e.g. "log-88321"
    service_id = Column(String(50), ForeignKey("services.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    level = Column(String(20), default="INFO", index=True) # INFO, WARN, ERROR, CRITICAL
    message = Column(Text, nullable=False)
    request_id = Column(String(50), nullable=True, index=True)
    http_method = Column(String(10), default="GET")
    http_status = Column(Integer, default=200)
    duration_ms = Column(Float, default=12.5)
    metadata_json = Column(JSON, default=dict)

    # Relationships
    service = relationship("Service", back_populates="logs")

class Trace(Base):
    __tablename__ = "traces"

    id = Column(String(50), primary_key=True, index=True) # e.g. "trc-88219"
    root_service_id = Column(String(50), nullable=False)
    operation_name = Column(String(100), nullable=False)   # e.g. "POST /api/v1/checkout"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    total_duration_ms = Column(Float, default=120.0)
    http_status = Column(Integer, default=200)
    has_error = Column(Boolean, default=False)
    user_id = Column(String(50), nullable=True)

    # Relationships
    spans = relationship("TraceSpan", back_populates="trace", cascade="all, delete-orphan")

class TraceSpan(Base):
    __tablename__ = "trace_spans"

    id = Column(String(50), primary_key=True, index=True) # e.g. "spn-1002"
    trace_id = Column(String(50), ForeignKey("traces.id"), nullable=False, index=True)
    parent_span_id = Column(String(50), nullable=True)
    service_id = Column(String(50), nullable=False)
    span_name = Column(String(100), nullable=False)       # e.g. "AuthTokenVerify", "StripeCharge"
    start_offset_ms = Column(Float, default=0.0)
    duration_ms = Column(Float, default=20.0)
    status = Column(String(20), default="ok")             # ok, error
    error_message = Column(Text, nullable=True)
    tags = Column(JSON, default=dict)

    # Relationships
    trace = relationship("Trace", back_populates="spans")
