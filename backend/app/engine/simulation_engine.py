import uuid
import random
import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.dashboard import SystemState, Notification
from app.models.service import Service
from app.models.metric import Metric
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.log_trace import LogEntry, Trace, TraceSpan
from app.engine.alert_engine import run_alert_evaluation
from app.engine.incident_engine import check_and_create_incident_from_alerts

def get_current_simulation_mode(db: Session) -> str:
    state = db.query(SystemState).filter(SystemState.key == "simulation_mode").first()
    return state.value if state else "normal"

def set_simulation_mode(db: Session, mode: str) -> None:
    state = db.query(SystemState).filter(SystemState.key == "simulation_mode").first()
    if not state:
        state = SystemState(key="simulation_mode", value=mode, metadata_json={})
        db.add(state)
    else:
        state.value = mode
    db.commit()

def trigger_normal_state(db: Session) -> Dict[str, Any]:
    """
    Restores the system to normal healthy steady state.
    """
    set_simulation_mode(db, "normal")
    now = datetime.datetime.utcnow()

    # Reset service statuses to healthy
    services = db.query(Service).all()
    for s in services:
        s.status = "healthy"
    
    # Inject healthy real-time metric points
    for s in services:
        db.add(Metric(
            service_id=s.id,
            timestamp=now,
            requests_per_sec=round(random.uniform(400, 1200), 1),
            error_rate=round(random.uniform(0.01, 0.04), 3),
            p50_latency=round(random.uniform(20, 50), 1),
            p95_latency=round(random.uniform(60, 110), 1),
            p99_latency=round(random.uniform(110, 180), 1),
            availability=round(random.uniform(99.96, 99.99), 3),
            cpu_percent=round(random.uniform(30, 50), 1),
            memory_percent=round(random.uniform(45, 60), 1)
        ))

    # Resolve any open simulation alerts
    open_alerts = db.query(Alert).filter(Alert.status == "open").all()
    for a in open_alerts:
        a.status = "resolved"
        a.resolved_at = now
    
    # Resolve active incidents if any
    active_incidents = db.query(Incident).filter(Incident.status == "active").all()
    for inc in active_incidents:
        inc.status = "resolved"
        inc.resolved_at = now
        events = list(inc.timeline or [])
        events.append({
            "timestamp": now.isoformat(),
            "message": "Telemetry restored to nominal baselines. Incident marked resolved.",
            "author": "SimulationEngine",
            "type": "status_change"
        })
        inc.timeline = events

    db.add(Notification(
        id=f"ntf-{uuid.uuid4().hex[:8]}",
        title="System Recovery Completed",
        message="All services restored to nominal health (99.97% aggregate availability).",
        type="system",
        severity="info",
        link="/overview",
        is_read=False
    ))

    db.commit()

    return {
        "status": "success",
        "simulation_mode": "normal",
        "message": "System successfully restored to nominal healthy state."
    }

def trigger_degraded_incident(db: Session) -> Dict[str, Any]:
    """
    Simulates a warning-level incident on Payment Service and ShopCloud API Gateway.
    Availability: 99.70% (Breaches 99.90% SLO)
    Latency: 280ms
    Error Rate: 0.35%
    """
    set_simulation_mode(db, "incident")
    now = datetime.datetime.utcnow()

    # Update Service Statuses
    payment_svc = db.query(Service).filter(Service.id == "payment-service").first()
    if payment_svc:
        payment_svc.status = "warning"
    api_svc = db.query(Service).filter(Service.id == "shopcloud-api").first()
    if api_svc:
        api_svc.status = "warning"

    # Inject degraded metric points for multiple recent intervals so rolling calculations react immediately
    for offset_mins in [15, 10, 5, 0]:
        t = now - datetime.timedelta(minutes=offset_mins)
        # Payment service degraded
        db.add(Metric(
            service_id="payment-service",
            timestamp=t,
            requests_per_sec=210.0,
            error_rate=0.38,
            p50_latency=120.0,
            p95_latency=285.0, # Breaches 250ms Warning Threshold
            p99_latency=390.0,
            availability=99.68, # Breaches 99.95% SLO
            cpu_percent=78.0,
            memory_percent=82.0
        ))
        # API Gateway impacted by payment downstream latency
        db.add(Metric(
            service_id="shopcloud-api",
            timestamp=t,
            requests_per_sec=1100.0,
            error_rate=0.32,
            p50_latency=65.0,
            p95_latency=215.0, # Breaches 200ms SLO
            p99_latency=320.0,
            availability=99.70, # Breaches 99.90% SLO
            cpu_percent=68.0,
            memory_percent=71.0
        ))
    
    # Inject correlated error logs
    db.add(LogEntry(
        id=f"log-{uuid.uuid4().hex[:6]}",
        service_id="payment-service",
        timestamp=now,
        level="WARN",
        message="Stripe API response latency exceeded 250ms threshold (upstream bank gateway timeout)",
        request_id="REQ-SIM-9921",
        http_method="POST",
        http_status=504,
        duration_ms=285.0,
        metadata_json={"gateway": "stripe", "error": "upstream_timeout"}
    ))

    db.commit()

    # Run Alert Rule Evaluation to automatically fire warning alerts
    created_alerts = run_alert_evaluation(db)

    # Check and generate Incident
    incident = check_and_create_incident_from_alerts(db, primary_service_id="payment-service", severity="medium")

    return {
        "status": "success",
        "simulation_mode": "incident",
        "affected_service": "payment-service",
        "availability": 99.70,
        "p95_latency": 285.0,
        "error_rate": 0.35,
        "alerts_triggered": len(created_alerts),
        "incident_id": incident.id if incident else None,
        "message": "Incident simulated: Payment Service latency degraded (285ms), SLO breached, warning alert dispatched."
    }

def trigger_critical_incident(db: Session) -> Dict[str, Any]:
    """
    Simulates a severe P1 Critical Incident (SLA + SLO breach).
    Availability: 99.35% (Breaches 99.50% SLA)
    Latency: 620ms
    Error Rate: 1.25%
    """
    set_simulation_mode(db, "critical_incident")
    now = datetime.datetime.utcnow()

    # Mark services Critical
    payment_svc = db.query(Service).filter(Service.id == "payment-service").first()
    if payment_svc:
        payment_svc.status = "critical"
    order_svc = db.query(Service).filter(Service.id == "order-service").first()
    if order_svc:
        order_svc.status = "critical"
    api_svc = db.query(Service).filter(Service.id == "shopcloud-api").first()
    if api_svc:
        api_svc.status = "critical"

    # Inject critical metric points
    for offset_mins in [20, 15, 10, 5, 0]:
        t = now - datetime.timedelta(minutes=offset_mins)
        # Payment service outage
        db.add(Metric(
            service_id="payment-service",
            timestamp=t,
            requests_per_sec=140.0,
            error_rate=1.45,
            p50_latency=340.0,
            p95_latency=650.0, # Massive latency spike
            p99_latency=1200.0,
            availability=99.30, # Severe SLA breach
            cpu_percent=94.0,
            memory_percent=91.0
        ))
        # Order service cascade
        db.add(Metric(
            service_id="order-service",
            timestamp=t,
            requests_per_sec=320.0,
            error_rate=1.20,
            p50_latency=210.0,
            p95_latency=520.0,
            p99_latency=980.0,
            availability=99.38,
            cpu_percent=88.0,
            memory_percent=85.0
        ))
        # API Gateway cascade
        db.add(Metric(
            service_id="shopcloud-api",
            timestamp=t,
            requests_per_sec=890.0,
            error_rate=1.15,
            p50_latency=180.0,
            p95_latency=580.0,
            p99_latency=1100.0,
            availability=99.35, # Violates 99.50% Enterprise SLA
            cpu_percent=92.0,
            memory_percent=89.0
        ))

    # Add Critical Error Logs
    db.add(LogEntry(
        id=f"log-{uuid.uuid4().hex[:6]}",
        service_id="payment-service",
        timestamp=now,
        level="CRITICAL",
        message="FATAL: Payment connection pool exhausted (300/300 active connections locked in deadlock)",
        request_id="REQ-SIM-CRIT-01",
        http_method="POST",
        http_status=500,
        duration_ms=650.0,
        metadata_json={"error_type": "ConnectionPoolTimeout", "active_threads": 300}
    ))
    db.add(LogEntry(
        id=f"log-{uuid.uuid4().hex[:6]}",
        service_id="order-service",
        timestamp=now,
        level="ERROR",
        message="Circuit breaker tripped OPEN for payment-service endpoint after 50 consecutive timeouts",
        request_id="REQ-SIM-CRIT-02",
        http_method="POST",
        http_status=503,
        duration_ms=520.0,
        metadata_json={"circuit_breaker": "OPEN", "target": "payment-service"}
    ))

    # Add Critical Trace with error spans
    trace_id = f"trc-crit-{uuid.uuid4().hex[:6]}"
    trace_obj = Trace(
        id=trace_id,
        root_service_id="shopcloud-api",
        operation_name="POST /api/v1/orders/checkout",
        timestamp=now,
        total_duration_ms=650.0,
        http_status=500,
        has_error=True,
        user_id="usr_enterprise_88"
    )
    db.add(trace_obj)
    db.commit()

    db.add(TraceSpan(
        id=f"spn-crit-1",
        trace_id=trace_id,
        parent_span_id=None,
        service_id="shopcloud-api",
        span_name="API Gateway Ingress (500 Error)",
        start_offset_ms=0.0,
        duration_ms=650.0,
        status="error",
        error_message="HTTP 500 Internal Server Error from downstream dependency",
        tags={"http.status": 500}
    ))
    db.add(TraceSpan(
        id=f"spn-crit-2",
        trace_id=trace_id,
        parent_span_id=f"spn-crit-1",
        service_id="order-service",
        span_name="OrderService.CreateOrder",
        start_offset_ms=25.0,
        duration_ms=620.0,
        status="error",
        error_message="Circuit breaker open: payment service unreachable",
        tags={"circuit_state": "OPEN"}
    ))
    db.add(TraceSpan(
        id=f"spn-crit-3",
        trace_id=trace_id,
        parent_span_id=f"spn-crit-2",
        service_id="payment-service",
        span_name="PaymentService.AuthorizeStripe (DEADLOCK)",
        start_offset_ms=50.0,
        duration_ms=580.0,
        status="error",
        error_message="Connection pool timeout after 500ms wait",
        tags={"db.pool": "exhausted"}
    ))

    db.commit()

    # Run Alert Rule Evaluation to automatically fire critical alerts
    created_alerts = run_alert_evaluation(db)

    # Create Critical Incident
    incident = check_and_create_incident_from_alerts(db, primary_service_id="payment-service", severity="critical")

    return {
        "status": "success",
        "simulation_mode": "critical_incident",
        "affected_service": "payment-service",
        "availability": 99.35,
        "p95_latency": 650.0,
        "error_rate": 1.25,
        "sla_breached": True,
        "slo_breached": True,
        "alerts_triggered": len(created_alerts),
        "incident_id": incident.id if incident else None,
        "message": "Critical Incident simulated: SLA violation triggered (< 99.50%), P1 Incident created, Critical alerts firing."
    }
