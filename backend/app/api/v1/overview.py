from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service import Service
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.metric import Metric
from app.engine.sli_calculator import calculate_aggregate_system_slis, get_time_window_start
from app.engine.slo_evaluator import calculate_overall_slo_compliance
from app.engine.sla_evaluator import calculate_overall_sla_compliance
from app.engine.budget_engine import get_error_budget_overview
from app.schemas.dashboard import OverviewKPIs

router = APIRouter()

@router.get("", response_model=OverviewKPIs)
def get_overview_kpis(time_range: str = Query("24h", description="Time window"), db: Session = Depends(get_db)):
    agg_slis = calculate_aggregate_system_slis(db, time_range)
    slo_comp = calculate_overall_slo_compliance(db)
    sla_comp = calculate_overall_sla_compliance(db)
    budget_overview = get_error_budget_overview(db)

    active_incidents_cnt = (
        db.query(Incident)
        .filter(Incident.status.in_(["active", "investigating", "identified", "monitoring"]))
        .count()
    )

    active_alerts_cnt = (
        db.query(Alert)
        .filter(Alert.status.in_(["open", "acknowledged"]))
        .count()
    )

    total_services = db.query(Service).count()
    healthy_services = db.query(Service).filter(Service.status == "healthy").count()

    # Generate sparkline trends from recent metrics (last 12 hours)
    recent_metrics = (
        db.query(Metric)
        .filter(Metric.service_id == "shopcloud-api")
        .order_by(Metric.timestamp.desc())
        .limit(15)
        .all()
    )
    recent_metrics.reverse()

    avail_spark = [round(m.availability, 2) for m in recent_metrics] or [99.95] * 10
    err_spark = [round(m.error_rate, 3) for m in recent_metrics] or [0.03] * 10
    latency_spark = [round(m.p95_latency, 1) for m in recent_metrics] or [110.0] * 10
    health_spark = [round(m.availability, 2) for m in recent_metrics] or [99.95] * 10

    return OverviewKPIs(
        system_health_status=agg_slis["status"],
        system_health_score=agg_slis["system_health_score"],
        availability=agg_slis["availability"],
        availability_target=agg_slis["availability_target"],
        slo_compliance_percent=slo_comp,
        sla_compliance_percent=sla_comp,
        error_budget_remaining_percent=budget_overview["budget_remaining_overall_percent"],
        active_incidents_count=active_incidents_cnt,
        active_alerts_count=active_alerts_cnt,
        total_services_count=total_services,
        healthy_services_count=healthy_services,
        sparklines={
            "health": health_spark,
            "availability": avail_spark,
            "error_rate": err_spark,
            "latency": latency_spark
        }
    )
