import datetime
from sqlalchemy import Column, String, Boolean, Text, DateTime, JSON
from app.db.database import Base

class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(String(50), primary_key=True, index=True) # e.g. "dash-overview"
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    tags = Column(JSON, default=list)
    layout_config = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="alert") # alert, slo_breach, sla_violation, incident, system
    severity = Column(String(20), default="info") # info, warning, critical
    link = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemState(Base):
    __tablename__ = "system_state"

    key = Column(String(50), primary_key=True) # e.g. "simulation_mode"
    value = Column(String(100), default="normal") # normal, incident, critical_incident
    metadata_json = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
