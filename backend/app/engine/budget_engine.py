from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.slo import SLO
from app.engine.slo_evaluator import evaluate_single_slo

def get_error_budget_overview(db: Session) -> Dict[str, Any]:
    slos = db.query(SLO).filter(SLO.is_active == True).all()
    
    evaluated_items = []
    total_allowed = 0.0
    total_consumed = 0.0

    for slo in slos:
        eval_slo = evaluate_single_slo(db, slo)
        
        allowed = eval_slo["error_budget_total_percent"]
        consumed = eval_slo["error_budget_consumed_percent"]
        remaining = eval_slo["error_budget_remaining_percent"]
        used_pct = round(100.0 - remaining, 1)

        total_allowed += allowed
        total_consumed += consumed

        evaluated_items.append({
            "service_id": slo.service_id,
            "service_name": eval_slo["service_name"],
            "slo_id": slo.id,
            "slo_name": slo.name,
            "metric_type": slo.metric_type,
            "allowed_budget_percent": allowed,
            "consumed_budget_percent": consumed,
            "remaining_budget_percent": round(max(0.0, allowed - consumed), 4),
            "budget_used_percentage": used_pct,
            "burn_rate_1h": eval_slo["burn_rate_1h"],
            "burn_rate_6h": eval_slo["burn_rate_6h"],
            "burn_rate_24h": eval_slo["burn_rate_24h"],
            "status": "healthy" if used_pct < 70 else ("warning" if used_pct < 100 else "critical")
        })

    # Sort by highest budget consumed first
    evaluated_items.sort(key=lambda x: x["budget_used_percentage"], reverse=True)

    overall_used_pct = round((total_consumed / max(0.0001, total_allowed)) * 100.0, 1) if total_allowed > 0 else 32.0
    overall_remaining_pct = max(0.0, round(100.0 - overall_used_pct, 1))

    return {
        "allowed_budget_total": round(total_allowed, 4),
        "consumed_budget_total": round(total_consumed, 4),
        "remaining_budget_total": round(max(0.0, total_allowed - total_consumed), 4),
        "budget_used_overall_percent": overall_used_pct,
        "budget_remaining_overall_percent": overall_remaining_pct,
        "services_consuming_most": evaluated_items[:5],
        "all_budgets": evaluated_items
    }
