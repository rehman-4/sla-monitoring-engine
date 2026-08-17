import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.alert import Alert
from app.engine.alert_engine import run_alert_evaluation
from app.schemas.alert import AlertRead, AlertAcknowledge

router = APIRouter()

@router.get("", response_model=List[AlertRead])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status: open, acknowledged, resolved"),
    severity: Optional[str] = Query(None, description="Filter by severity: critical, warning, info"),
    service_id: Optional[str] = Query(None, description="Filter by service"),
    db: Session = Depends(get_db)
):
    # Run dynamic evaluation on fetch to ensure live freshness
    run_alert_evaluation(db)

    query = db.query(Alert).order_by(Alert.started_at.desc())
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if service_id:
        query = query.filter(Alert.service_id == service_id)

    alerts = query.all()
    results = []
    now = datetime.datetime.utcnow()

    for a in alerts:
        end_time = a.resolved_at or now
        duration_mins = max(1, int((end_time - a.started_at).total_seconds() / 60))

        results.append(AlertRead(
            id=a.id,
            service_id=a.service_id,
            service_name=a.service.name if a.service else a.service_id,
            monitor_id=a.monitor_id,
            slo_id=a.slo_id,
            severity=a.severity,
            status=a.status,
            title=a.title,
            description=a.description,
            metric_type=a.metric_type,
            current_value=a.current_value,
            threshold_value=a.threshold_value,
            started_at=a.started_at,
            acknowledged_at=a.acknowledged_at,
            resolved_at=a.resolved_at,
            acknowledged_by=a.acknowledged_by,
            incident_id=a.incident_id,
            duration_minutes=duration_mins
        ))

    return results

@router.get("/{alert_id}", response_model=AlertRead)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    now = datetime.datetime.utcnow()
    end_time = a.resolved_at or now
    duration_mins = max(1, int((end_time - a.started_at).total_seconds() / 60))

    return AlertRead(
        id=a.id,
        service_id=a.service_id,
        service_name=a.service.name if a.service else a.service_id,
        monitor_id=a.monitor_id,
        slo_id=a.slo_id,
        severity=a.severity,
        status=a.status,
        title=a.title,
        description=a.description,
        metric_type=a.metric_type,
        current_value=a.current_value,
        threshold_value=a.threshold_value,
        started_at=a.started_at,
        acknowledged_at=a.acknowledged_at,
        resolved_at=a.resolved_at,
        acknowledged_by=a.acknowledged_by,
        incident_id=a.incident_id,
        duration_minutes=duration_mins
    )

@router.post("/{alert_id}/acknowledge", response_model=AlertRead)
def acknowledge_alert(alert_id: str, payload: AlertAcknowledge, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    a.status = "acknowledged"
    a.acknowledged_at = datetime.datetime.utcnow()
    a.acknowledged_by = payload.acknowledged_by
    db.commit()
    db.refresh(a)

    return get_alert(alert_id, db)

@router.post("/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")

    a.status = "resolved"
    a.resolved_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(a)

    return get_alert(alert_id, db)
