import uuid
import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.monitor import Monitor
from app.models.alert import Alert
from app.models.service import Service
from app.models.dashboard import Notification
from app.engine.sli_calculator import calculate_service_slis

def evaluate_monitor_rule(condition: str, current_value: float, warning_threshold: float, critical_threshold: float) -> Tuple[bool, str, float]:
    """
    Returns (is_breached, severity, matched_threshold)
    """
    if condition == "lt": # e.g. availability < 99.90
        if current_value < critical_threshold:
            return True, "critical", critical_threshold
        elif current_value < warning_threshold:
            return True, "warning", warning_threshold
    elif condition == "gt": # e.g. latency > 200 or error_rate > 0.10
        if current_value > critical_threshold:
            return True, "critical", critical_threshold
        elif current_value > warning_threshold:
            return True, "warning", warning_threshold
    elif condition == "lte":
        if current_value <= critical_threshold:
            return True, "critical", critical_threshold
        elif current_value <= warning_threshold:
            return True, "warning", warning_threshold
    elif condition == "gte":
        if current_value >= critical_threshold:
            return True, "critical", critical_threshold
        elif current_value >= warning_threshold:
            return True, "warning", warning_threshold

    return False, "info", 0.0

def run_alert_evaluation(db: Session) -> List[Alert]:
    """
    Scans all enabled monitors, evaluates latest telemetry against thresholds,
    and creates or updates active alerts.
    """
    monitors = db.query(Monitor).filter(Monitor.is_enabled == True).all()
    created_or_active_alerts = []

    for mon in monitors:
        # Get latest metrics for this service over monitor's evaluation window
        time_window = f"{mon.evaluation_window_minutes}m" if mon.evaluation_window_minutes <= 60 else "1h"
        slis = calculate_service_slis(db, mon.service_id, time_range=time_window)

        # Get relevant metric value
        if mon.metric_type == "availability":
            current_val = slis["availability"]
        elif mon.metric_type in ["latency_p95", "latency"]:
            current_val = slis["p95_latency"]
        elif mon.metric_type == "error_rate":
            current_val = slis["error_rate"]
        elif mon.metric_type == "cpu_percent":
            current_val = slis["cpu_percent"]
        else:
            current_val = slis["availability"]

        is_breached, severity, threshold = evaluate_monitor_rule(
            mon.condition, current_val, mon.warning_threshold, mon.critical_threshold
        )

        existing_open_alert = (
            db.query(Alert)
            .filter(
                Alert.monitor_id == mon.id,
                Alert.status.in_(["open", "acknowledged"])
            )
            .first()
        )

        if is_breached:
            if not existing_open_alert:
                # Create fresh alert
                alert_id = f"alt-{uuid.uuid4().hex[:8]}"
                svc_name = mon.service.name if mon.service else mon.service_id
                title = f"[{severity.upper()}] {mon.name} on {svc_name}"
                desc = f"Metric {mon.metric_type} is currently {current_val} which breached threshold {threshold}."
                
                new_alert = Alert(
                    id=alert_id,
                    monitor_id=mon.id,
                    service_id=mon.service_id,
                    severity=severity,
                    status="open",
                    title=title,
                    description=desc,
                    metric_type=mon.metric_type,
                    current_value=current_val,
                    threshold_value=threshold,
                    started_at=datetime.datetime.utcnow()
                )
                db.add(new_alert)

                # Add Notification
                db.add(Notification(
                    id=f"ntf-{uuid.uuid4().hex[:8]}",
                    title=f"New Alert: {title}",
                    message=desc,
                    type="alert",
                    severity=severity,
                    link=f"/alerts",
                    is_read=False
                ))

                db.commit()
                created_or_active_alerts.append(new_alert)
            else:
                # Update existing alert with latest value and severity escalation if needed
                existing_open_alert.current_value = current_val
                if severity == "critical" and existing_open_alert.severity != "critical":
                    existing_open_alert.severity = "critical"
                    existing_open_alert.title = f"[CRITICAL] {mon.name} on {mon.service.name}"
                db.commit()
                created_or_active_alerts.append(existing_open_alert)
        else:
            # If was previously open and condition normalized, auto-resolve
            if existing_open_alert:
                existing_open_alert.status = "resolved"
                existing_open_alert.resolved_at = datetime.datetime.utcnow()
                db.commit()

    return created_or_active_alerts
