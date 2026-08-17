from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service import Service
from app.engine.sli_calculator import calculate_service_slis

router = APIRouter()

@router.get("")
def get_all_slis(time_range: str = Query("24h"), service_id: str = Query(None), db: Session = Depends(get_db)):
    query = db.query(Service)
    if service_id:
        query = query.filter(Service.id == service_id)
    services = query.all()

    slis_list = []
    for s in services:
        calc = calculate_service_slis(db, s.id, time_range)
        
        # Availability SLI (Target ≥ 99.90%)
        avail_target = 99.90
        avail_status = "PASS" if calc["availability"] >= avail_target else "FAIL"

        # Latency SLI (Target ≤ 200ms)
        lat_target = 200.0
        lat_status = "PASS" if calc["p95_latency"] <= lat_target else "FAIL"

        # Error Rate SLI (Target ≤ 0.10%)
        err_target = 0.10
        err_status = "PASS" if calc["error_rate"] <= err_target else "FAIL"

        slis_list.append({
            "service_id": s.id,
            "service_name": s.name,
            "tier": s.tier,
            "time_range": time_range,
            "availability": {
                "current": calc["availability"],
                "target": avail_target,
                "status": avail_status
            },
            "latency": {
                "current": calc["p95_latency"],
                "target": lat_target,
                "status": lat_status
            },
            "error_rate": {
                "current": calc["error_rate"],
                "target": err_target,
                "status": err_status
            },
            "requests_per_sec": calc["requests_per_sec"],
            "p50_latency": calc["p50_latency"],
            "p99_latency": calc["p99_latency"]
        })

    return slis_list
