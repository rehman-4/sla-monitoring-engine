import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.monitor import Monitor
from app.models.service import Service
from app.engine.sli_calculator import calculate_service_slis
from app.engine.alert_engine import evaluate_monitor_rule
from app.schemas.monitor import MonitorRead, MonitorCreate, MonitorUpdate

router = APIRouter()

@router.get("", response_model=List[MonitorRead])
def list_monitors(db: Session = Depends(get_db)):
    monitors = db.query(Monitor).all()
    results = []

    for m in monitors:
        slis = calculate_service_slis(db, m.service_id, "15m")
        if m.metric_type == "availability":
            curr = slis["availability"]
        elif m.metric_type in ["latency_p95", "latency"]:
            curr = slis["p95_latency"]
        elif m.metric_type == "error_rate":
            curr = slis["error_rate"]
        else:
            curr = slis["availability"]

        if not m.is_enabled:
            status = "DISABLED"
        else:
            breached, sev, _ = evaluate_monitor_rule(m.condition, curr, m.warning_threshold, m.critical_threshold)
            status = sev.upper() if breached else "OK"

        results.append(MonitorRead(
            id=m.id,
            name=m.name,
            service_id=m.service_id,
            service_name=m.service.name if m.service else m.service_id,
            metric_type=m.metric_type,
            condition=m.condition,
            warning_threshold=m.warning_threshold,
            critical_threshold=m.critical_threshold,
            evaluation_window_minutes=m.evaluation_window_minutes,
            severity=m.severity,
            is_enabled=m.is_enabled,
            notification_channel=m.notification_channel,
            description=m.description,
            current_value=curr,
            status=status,
            created_at=m.created_at
        ))

    return results

@router.post("", response_model=MonitorRead, status_code=201)
def create_monitor(payload: MonitorCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=400, detail="Service not found")

    mon_id = f"mon-{uuid.uuid4().hex[:8]}"
    new_mon = Monitor(
        id=mon_id,
        name=payload.name,
        service_id=payload.service_id,
        metric_type=payload.metric_type,
        condition=payload.condition,
        warning_threshold=payload.warning_threshold,
        critical_threshold=payload.critical_threshold,
        evaluation_window_minutes=payload.evaluation_window_minutes,
        severity=payload.severity,
        is_enabled=payload.is_enabled,
        notification_channel=payload.notification_channel,
        description=payload.description
    )
    db.add(new_mon)
    db.commit()
    db.refresh(new_mon)

    return MonitorRead(
        id=new_mon.id,
        name=new_mon.name,
        service_id=new_mon.service_id,
        service_name=service.name,
        metric_type=new_mon.metric_type,
        condition=new_mon.condition,
        warning_threshold=new_mon.warning_threshold,
        critical_threshold=new_mon.critical_threshold,
        evaluation_window_minutes=new_mon.evaluation_window_minutes,
        severity=new_mon.severity,
        is_enabled=new_mon.is_enabled,
        notification_channel=new_mon.notification_channel,
        description=new_mon.description,
        current_value=99.95,
        status="OK",
        created_at=new_mon.created_at
    )

@router.put("/{monitor_id}", response_model=MonitorRead)
def update_monitor(monitor_id: str, payload: MonitorUpdate, db: Session = Depends(get_db)):
    mon = db.query(Monitor).filter(Monitor.id == monitor_id).first()
    if not mon:
        raise HTTPException(status_code=404, detail="Monitor not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(mon, field, val)

    db.commit()
    db.refresh(mon)

    return MonitorRead(
        id=mon.id,
        name=mon.name,
        service_id=mon.service_id,
        service_name=mon.service.name if mon.service else mon.service_id,
        metric_type=mon.metric_type,
        condition=mon.condition,
        warning_threshold=mon.warning_threshold,
        critical_threshold=mon.critical_threshold,
        evaluation_window_minutes=mon.evaluation_window_minutes,
        severity=mon.severity,
        is_enabled=mon.is_enabled,
        notification_channel=mon.notification_channel,
        description=mon.description,
        current_value=99.95,
        status="OK" if mon.is_enabled else "DISABLED",
        created_at=mon.created_at
    )

@router.delete("/{monitor_id}", status_code=204)
def delete_monitor(monitor_id: str, db: Session = Depends(get_db)):
    mon = db.query(Monitor).filter(Monitor.id == monitor_id).first()
    if not mon:
        raise HTTPException(status_code=404, detail="Monitor not found")

    db.delete(mon)
    db.commit()
    return None
