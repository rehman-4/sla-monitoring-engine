from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.database import get_db
from app.models.service import Service
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.slo import SLO
from app.models.sla import SLA
from app.models.monitor import Monitor
from app.schemas.dashboard import GlobalSearchItem

router = APIRouter()

@router.get("", response_model=List[GlobalSearchItem])
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    results = []
    term = f"%{q}%"

    # Search Services
    services = db.query(Service).filter(
        or_(Service.name.ilike(term), Service.description.ilike(term))
    ).limit(5).all()
    for s in services:
        results.append(GlobalSearchItem(
            id=s.id,
            type="service",
            title=s.name,
            subtitle=f"{s.tier.upper()} | {s.owner_team}",
            status=s.status,
            url=f"/services/{s.id}"
        ))

    # Search SLOs
    slos = db.query(SLO).filter(
        or_(SLO.name.ilike(term), SLO.description.ilike(term))
    ).limit(5).all()
    for slo in slos:
        results.append(GlobalSearchItem(
            id=slo.id,
            type="slo",
            title=slo.name,
            subtitle=f"Target: {slo.target_percentage}% | {slo.service_id}",
            status="active" if slo.is_active else "inactive",
            url="/slos"
        ))

    # Search Incidents
    incidents = db.query(Incident).filter(
        or_(Incident.title.ilike(term), Incident.summary.ilike(term), Incident.id.ilike(term))
    ).limit(5).all()
    for inc in incidents:
        results.append(GlobalSearchItem(
            id=inc.id,
            type="incident",
            title=f"[{inc.id}] {inc.title}",
            subtitle=f"Severity: {inc.severity.upper()} | Lead: {inc.lead_sre}",
            status=inc.status,
            url=f"/incidents/{inc.id}"
        ))

    # Search Alerts
    alerts = db.query(Alert).filter(
        or_(Alert.title.ilike(term), Alert.description.ilike(term), Alert.id.ilike(term))
    ).limit(5).all()
    for a in alerts:
        results.append(GlobalSearchItem(
            id=a.id,
            type="alert",
            title=f"[{a.id}] {a.title}",
            subtitle=f"Current: {a.current_value} (Threshold: {a.threshold_value})",
            status=a.status,
            url=f"/alerts/{a.id}"
        ))

    # Search Monitors
    monitors = db.query(Monitor).filter(
        or_(Monitor.name.ilike(term), Monitor.description.ilike(term))
    ).limit(5).all()
    for m in monitors:
        results.append(GlobalSearchItem(
            id=m.id,
            type="monitor",
            title=m.name,
            subtitle=f"Metric: {m.metric_type} | Channel: {m.notification_channel}",
            status="enabled" if m.is_enabled else "disabled",
            url="/monitors"
        ))

    return results
