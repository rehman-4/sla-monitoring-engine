import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.incident import Incident
from app.models.alert import Alert
from app.models.service import Service
from app.schemas.incident import (
    IncidentRead, IncidentCreate, IncidentUpdate, IncidentAddEvent
)
from app.engine.incident_engine import add_incident_event

router = APIRouter()

@router.get("", response_model=List[IncidentRead])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status: active, resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low"),
    db: Session = Depends(get_db)
):
    query = db.query(Incident).order_by(Incident.started_at.desc())
    if status == "active":
        query = query.filter(Incident.status.in_(["active", "investigating", "identified", "monitoring"]))
    elif status == "resolved":
        query = query.filter(Incident.status == "resolved")
    elif status:
        query = query.filter(Incident.status == status)

    if severity:
        query = query.filter(Incident.severity == severity)

    incidents = query.all()
    results = []
    now = datetime.datetime.utcnow()

    for inc in incidents:
        end_time = inc.resolved_at or now
        dur_mins = max(1, int((end_time - inc.started_at).total_seconds() / 60))
        alerts_cnt = db.query(Alert).filter(Alert.incident_id == inc.id).count()

        results.append(IncidentRead(
            id=inc.id,
            title=inc.title,
            severity=inc.severity,
            status=inc.status,
            summary=inc.summary,
            impact=inc.impact,
            root_cause=inc.root_cause,
            primary_service_id=inc.primary_service_id,
            affected_services=inc.affected_services or [],
            lead_sre=inc.lead_sre,
            started_at=inc.started_at,
            resolved_at=inc.resolved_at,
            duration_minutes=dur_mins,
            timeline=inc.timeline or [],
            alerts_count=alerts_cnt
        ))

    return results

@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    now = datetime.datetime.utcnow()
    end_time = inc.resolved_at or now
    dur_mins = max(1, int((end_time - inc.started_at).total_seconds() / 60))
    alerts_cnt = db.query(Alert).filter(Alert.incident_id == inc.id).count()

    return IncidentRead(
        id=inc.id,
        title=inc.title,
        severity=inc.severity,
        status=inc.status,
        summary=inc.summary,
        impact=inc.impact,
        root_cause=inc.root_cause,
        primary_service_id=inc.primary_service_id,
        affected_services=inc.affected_services or [],
        lead_sre=inc.lead_sre,
        started_at=inc.started_at,
        resolved_at=inc.resolved_at,
        duration_minutes=dur_mins,
        timeline=inc.timeline or [],
        alerts_count=alerts_cnt
    )

@router.post("", response_model=IncidentRead, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    inc_id = f"INC-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    initial_timeline = [
        {
            "timestamp": now.isoformat(),
            "message": f"Incident declared by {payload.lead_sre}. Severity: {payload.severity.upper()}",
            "author": payload.lead_sre,
            "type": "status_change"
        }
    ]

    new_incident = Incident(
        id=inc_id,
        title=payload.title,
        severity=payload.severity,
        status="active",
        summary=payload.summary,
        impact=payload.impact,
        root_cause=payload.root_cause,
        primary_service_id=payload.primary_service_id,
        affected_services=payload.affected_services,
        lead_sre=payload.lead_sre,
        started_at=now,
        timeline=initial_timeline
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    return get_incident(new_incident.id, db)

@router.put("/{incident_id}", response_model=IncidentRead)
def update_incident(incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(inc, field, val)

    if payload.status == "resolved" and not inc.resolved_at:
        inc.resolved_at = datetime.datetime.utcnow()
        # Add timeline event
        events = list(inc.timeline or [])
        events.append({
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "message": f"Incident marked as RESOLVED by {payload.lead_sre or inc.lead_sre}.",
            "author": payload.lead_sre or inc.lead_sre,
            "type": "status_change"
        })
        inc.timeline = events

    db.commit()
    db.refresh(inc)

    return get_incident(inc.id, db)

@router.post("/{incident_id}/events", response_model=IncidentRead)
def add_event_to_incident(incident_id: str, payload: IncidentAddEvent, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    updated_inc = add_incident_event(db, incident_id, payload.message, payload.author, payload.type)
    return get_incident(updated_inc.id, db)
