import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.slo import SLO
from app.models.service import Service
from app.engine.sli_calculator import calculate_service_slis, get_time_window_start

def evaluate_single_slo(db: Session, slo: SLO) -> Dict[str, Any]:
    # Calculate SLI over the SLO's rolling window (e.g. 30 days)
    slis = calculate_service_slis(db, slo.service_id, time_range=f"{slo.time_window_days}d")
    
    current_val = 0.0
    current_val_formatted = ""
    status = "PASS"
    compliance_percent = 100.0

    # Error Budget Calculations
    # Allowed error percentage for availability = (100 - target_percentage)
    if slo.metric_type == "availability":
        current_val = slis["availability"]
        current_val_formatted = f"{current_val:.3f}%"
        allowed_error = max(0.0001, 100.0 - slo.target_percentage)
        actual_error = max(0.0, 100.0 - current_val)
        
        # Compliance percentage
        compliance_percent = min(100.0, (current_val / slo.target_percentage) * 100.0) if slo.target_percentage > 0 else 100.0
        
        if current_val < slo.critical_threshold:
            status = "BREACHED"
        elif current_val < slo.warning_threshold:
            status = "WARNING"
        else:
            status = "PASS"

    elif slo.metric_type == "latency_p95":
        current_val = slis["p95_latency"]
        target = slo.target_value or 200.0
        current_val_formatted = f"{current_val:.1f} ms"
        allowed_error = target * 0.1 # 10% tolerance margin
        actual_error = max(0.0, current_val - target)

        if target > 0:
            compliance_percent = max(0.0, min(100.0, 100.0 - (max(0.0, current_val - target) / target * 100.0)))
        else:
            compliance_percent = 100.0

        if current_val > slo.critical_threshold:
            status = "BREACHED"
        elif current_val > slo.warning_threshold:
            status = "WARNING"
        else:
            status = "PASS"

    elif slo.metric_type == "error_rate":
        current_val = slis["error_rate"]
        target = slo.target_value or 0.10
        current_val_formatted = f"{current_val:.3f}%"
        allowed_error = target
        actual_error = current_val

        compliance_percent = max(0.0, min(100.0, 100.0 - (current_val * 100.0)))

        if current_val > slo.critical_threshold:
            status = "BREACHED"
        elif current_val > slo.warning_threshold:
            status = "WARNING"
        else:
            status = "PASS"

    else:
        current_val = slis["availability"]
        current_val_formatted = f"{current_val:.2f}%"
        allowed_error = 0.10
        actual_error = 0.05
        compliance_percent = 99.9

    # Calculate Error Budget percentage
    # Total allowed budget in percentage
    error_budget_total = allowed_error
    consumed_ratio = min(1.0, actual_error / max(0.0001, error_budget_total)) if error_budget_total > 0 else 0.0
    error_budget_consumed = consumed_ratio * error_budget_total
    error_budget_remaining_percent = max(0.0, round((1.0 - consumed_ratio) * 100.0, 1))

    # Fast multi-window burn rates (1h, 6h, 24h)
    slis_1h = calculate_service_slis(db, slo.service_id, "1h")
    slis_6h = calculate_service_slis(db, slo.service_id, "6h")
    slis_24h = calculate_service_slis(db, slo.service_id, "24h")

    if slo.metric_type == "availability":
        err_1h = max(0.0, 100.0 - slis_1h["availability"])
        err_6h = max(0.0, 100.0 - slis_6h["availability"])
        err_24h = max(0.0, 100.0 - slis_24h["availability"])
    else:
        err_1h = slis_1h["error_rate"]
        err_6h = slis_6h["error_rate"]
        err_24h = slis_24h["error_rate"]

    burn_1h = round(err_1h / max(0.001, error_budget_total), 2)
    burn_6h = round(err_6h / max(0.001, error_budget_total), 2)
    burn_24h = round(err_24h / max(0.001, error_budget_total), 2)

    return {
        "id": slo.id,
        "name": slo.name,
        "service_id": slo.service_id,
        "service_name": slo.service.name if slo.service else slo.service_id,
        "metric_type": slo.metric_type,
        "target_percentage": slo.target_percentage,
        "target_value": slo.target_value,
        "time_window_days": slo.time_window_days,
        "warning_threshold": slo.warning_threshold,
        "critical_threshold": slo.critical_threshold,
        "description": slo.description,
        "is_active": slo.is_active,
        "created_at": slo.created_at,
        "current_compliance": round(compliance_percent, 2),
        "current_value_formatted": current_val_formatted,
        "status": status,
        "error_budget_total_percent": round(error_budget_total, 4),
        "error_budget_consumed_percent": round(error_budget_consumed, 4),
        "error_budget_remaining_percent": error_budget_remaining_percent,
        "burn_rate_1h": burn_1h,
        "burn_rate_6h": burn_6h,
        "burn_rate_24h": burn_24h
    }

def evaluate_all_slos(db: Session) -> List[Dict[str, Any]]:
    slos = db.query(SLO).filter(SLO.is_active == True).all()
    return [evaluate_single_slo(db, slo) for slo in slos]

def calculate_overall_slo_compliance(db: Session) -> float:
    evaluated = evaluate_all_slos(db)
    if not evaluated:
        return 100.0
    passing_count = sum(1 for s in evaluated if s["status"] == "PASS")
    return round((passing_count / len(evaluated)) * 100.0, 1)
