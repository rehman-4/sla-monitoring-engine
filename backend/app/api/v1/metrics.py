from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service import Service
from app.models.metric import Metric
from app.schemas.metric import MetricPoint, MetricQueryResponse
from app.engine.sli_calculator import get_time_window_start

router = APIRouter()

@router.get("", response_model=MetricQueryResponse)
def query_metrics(
    service_id: str = Query(..., description="Service ID"),
    time_range: str = Query("24h", description="Time Range: 15m, 1h, 6h, 24h, 7d, 30d"),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    start_time = get_time_window_start(time_range)

    metrics = (
        db.query(Metric)
        .filter(Metric.service_id == service_id, Metric.timestamp >= start_time)
        .order_by(Metric.timestamp.asc())
        .all()
    )

    if not metrics:
        metrics = (
            db.query(Metric)
            .filter(Metric.service_id == service_id)
            .order_by(Metric.timestamp.desc())
            .limit(20)
            .all()
        )
        metrics.reverse()

    points = [
        MetricPoint(
            timestamp=m.timestamp,
            requests_per_sec=m.requests_per_sec,
            error_rate=m.error_rate,
            p50_latency=m.p50_latency,
            p95_latency=m.p95_latency,
            p99_latency=m.p99_latency,
            availability=m.availability,
            cpu_percent=m.cpu_percent,
            memory_percent=m.memory_percent
        )
        for m in metrics
    ]

    count = len(points)
    if count > 0:
        avg_rps = round(sum(p.requests_per_sec for p in points) / count, 1)
        avg_err = round(sum(p.error_rate for p in points) / count, 3)
        avg_p95 = round(sum(p.p95_latency for p in points) / count, 1)
        avg_avail = round(sum(p.availability for p in points) / count, 3)
        min_p95 = round(min(p.p95_latency for p in points), 1)
        max_p95 = round(max(p.p95_latency for p in points), 1)
    else:
        avg_rps = avg_err = avg_p95 = avg_avail = min_p95 = max_p95 = 0.0

    return MetricQueryResponse(
        service_id=service.id,
        service_name=service.name,
        time_range=time_range,
        points=points,
        summary={
            "avg_rps": avg_rps,
            "avg_error_rate": avg_err,
            "avg_p95": avg_p95,
            "avg_availability": avg_avail,
            "min_p95": min_p95,
            "max_p95": max_p95
        }
    )
