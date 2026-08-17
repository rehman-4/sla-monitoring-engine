import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.alert import Alert
from app.models.service import Service
from app.models.dashboard import Notification

def check_and_create_incident_from_alerts(db: Session, primary_service_id: str, severity: str = "high") -> Optional[Incident]:
    """
    Correlates open critical alerts and automatically creates or links to an active Incident.
    """
    open_alerts = (
        db.query(Alert)
        .filter(Alert.service_id == primary_service_id, Alert.status == "open")
        .all()
    )

    if not open_alerts:
        return None

    # Check if there is already an active incident for this service
    active_incident = (
        db.query(Incident)
        .filter(
            Incident.primary_service_id == primary_service_id,
            Incident.status.in_(["active", "investigating", "identified", "monitoring"])
        )
        .first()
    )

    now = datetime.datetime.utcnow()
    now_iso = now.isoformat()

    if not active_incident:
        inc_id = f"INC-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
        svc = db.query(Service).filter(Service.id == primary_service_id).first()
        svc_name = svc.name if svc else primary_service_id

        title = f"Critical Service Degradation in {svc_name}"
        summary = f"Automated incident triggered by {len(open_alerts)} firing telemetry alerts on {svc_name}."
        impact = f"Elevated error rates and latency affecting downstream clients."

        timeline = [
            {
                "timestamp": now_iso,
                "message": f"Incident automatically declared from telemetry breach on {svc_name}.",
                "author": "IncidentEngine",
                "type": "status_change"
            }
        ]

        active_incident = Incident(
            id=inc_id,
            title=title,
            severity=severity,
            status="active",
            summary=summary,
            impact=impact,
            primary_service_id=primary_service_id,
            affected_services=[primary_service_id],
            lead_sre="Sarah Chen (Lead SRE)",
            started_at=now,
            timeline=timeline
        )
        db.add(active_incident)

        db.add(Notification(
            id=f"ntf-{uuid.uuid4().hex[:8]}",
            title=f"Incident Declared: {inc_id}",
            message=f"{title} ({severity.upper()})",
            type="incident",
            severity="critical" if severity == "critical" else "warning",
            link="/incidents",
            is_read=False
        ))

        db.commit()

    # Link alerts to this incident
    for a in open_alerts:
        if not a.incident_id:
            a.incident_id = active_incident.id
    db.commit()

    return active_incident

def add_incident_event(db: Session, incident_id: str, message: str, author: str = "SRE On-Call", event_type: str = "note") -> Incident:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise ValueError("Incident not found")

    events = list(incident.timeline or [])
    events.append({
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "message": message,
        "author": author,
        "type": event_type
    })
    incident.timeline = events
    db.commit()
    db.refresh(incident)
    return incident
