from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.sla import SLA
from app.engine.sli_calculator import calculate_service_slis

def evaluate_single_sla(db: Session, sla: SLA) -> Dict[str, Any]:
    slis = calculate_service_slis(db, sla.service_id, time_range="30d")
    
    current_compliance = slis["availability"]
    status = "Compliant"
    penalty_risk = "None"

    if current_compliance < sla.target_percentage:
        status = "Breached"
        penalty_risk = "Triggered"
    elif current_compliance < sla.target_percentage + 0.10:
        status = "At Risk"
        penalty_risk = "High"

    return {
        "id": sla.id,
        "name": sla.name,
        "service_id": sla.service_id,
        "service_name": sla.service.name if sla.service else sla.service_id,
        "customer_tier": sla.customer_tier,
        "metric_type": sla.metric_type,
        "target_percentage": sla.target_percentage,
        "target_value": sla.target_value,
        "current_compliance": round(current_compliance, 3),
        "status": status,
        "penalty_risk": penalty_risk,
        "penalty_terms": sla.penalty_terms,
        "created_at": sla.created_at
    }

def evaluate_all_slas(db: Session) -> List[Dict[str, Any]]:
    slas = db.query(SLA).all()
    return [evaluate_single_sla(db, s) for s in slas]

def calculate_overall_sla_compliance(db: Session) -> float:
    evaluated = evaluate_all_slas(db)
    if not evaluated:
        return 100.0
    compliant_count = sum(1 for s in evaluated if s["status"] == "Compliant")
    return round((compliant_count / len(evaluated)) * 100.0, 1)
