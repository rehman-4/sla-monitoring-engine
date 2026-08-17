import math
import random
import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.service import Service, ServiceDependency
from app.models.metric import Metric
from app.models.slo import SLO
from app.models.sla import SLA
from app.models.monitor import Monitor
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.log_trace import LogEntry, Trace, TraceSpan
from app.models.dashboard import Dashboard, Notification, SystemState

def seed_database(db: Session = None):
    should_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True

    try:
        # Check if already seeded
        if db.query(Service).first():
            print("Database already contains services. Checking system state...")
            if not db.query(SystemState).filter(SystemState.key == "simulation_mode").first():
                db.add(SystemState(key="simulation_mode", value="normal", metadata_json={}))
                db.commit()
            return

        print("Seeding ShopCloud Observability Platform database...")

        # 1. System State
        db.add(SystemState(key="simulation_mode", value="normal", metadata_json={}))

        # 2. Services
        services_data = [
            {
                "id": "shopcloud-api",
                "name": "ShopCloud API Gateway",
                "slug": "shopcloud-api",
                "tier": "tier-1",
                "status": "healthy",
                "description": "Public API ingress, edge rate limiting, SSL termination, and microservice router.",
                "owner_team": "Core Platform SRE",
                "environment": "production"
            },
            {
                "id": "auth-service",
                "name": "Authentication Service",
                "slug": "auth-service",
                "tier": "tier-1",
                "status": "healthy",
                "description": "OIDC/OAuth2 authentication, JWT session verification, and API key management.",
                "owner_team": "Security & Identity",
                "environment": "production"
            },
            {
                "id": "payment-service",
                "name": "Payment Service",
                "slug": "payment-service",
                "tier": "tier-1",
                "status": "healthy",
                "description": "Payment capture, Stripe/Adyen connector, transaction settlements, and refund engine.",
                "owner_team": "Checkout & Billing",
                "environment": "production"
            },
            {
                "id": "order-service",
                "name": "Order Service",
                "slug": "order-service",
                "tier": "tier-1",
                "status": "healthy",
                "description": "Shopping cart lifecycle, order state machine, checkout orchestrator, and receipts.",
                "owner_team": "Checkout & Billing",
                "environment": "production"
            },
            {
                "id": "product-catalog",
                "name": "Product Catalog",
                "slug": "product-catalog",
                "tier": "tier-2",
                "status": "healthy",
                "description": "Product metadata, categories, pricing tables, inventory lookup, and media asset CDN.",
                "owner_team": "Catalog Engineering",
                "environment": "production"
            },
            {
                "id": "search-service",
                "name": "Search & Recs Service",
                "slug": "search-service",
                "tier": "tier-2",
                "status": "healthy",
                "description": "Elasticsearch & vector indexing for full-text search, auto-complete, and personalized recs.",
                "owner_team": "Search & Discovery",
                "environment": "production"
            },
            {
                "id": "inventory-service",
                "name": "Inventory Service",
                "slug": "inventory-service",
                "tier": "tier-2",
                "status": "healthy",
                "description": "Multi-warehouse real-time inventory allocation, stock reservation locks, and replenishment alerts.",
                "owner_team": "Fulfillment Ops",
                "environment": "production"
            },
            {
                "id": "notification-service",
                "name": "Notification Service",
                "slug": "notification-service",
                "tier": "tier-3",
                "status": "healthy",
                "description": "Transactional email, SMS notifications, push notifications, and customer webhook queues.",
                "owner_team": "Communications",
                "environment": "production"
            }
        ]

        for s in services_data:
            db.add(Service(**s))
        db.commit()

        # 3. Dependencies (Topology Graph)
        deps = [
            ("dep-1", "shopcloud-api", "auth-service", "sync_http", 12.0),
            ("dep-2", "shopcloud-api", "product-catalog", "sync_http", 18.0),
            ("dep-3", "shopcloud-api", "order-service", "sync_http", 25.0),
            ("dep-4", "shopcloud-api", "search-service", "sync_http", 22.0),
            ("dep-5", "order-service", "payment-service", "sync_http", 45.0),
            ("dep-6", "order-service", "inventory-service", "sync_http", 20.0),
            ("dep-7", "order-service", "notification-service", "async_queue", 10.0),
            ("dep-8", "search-service", "product-catalog", "grpc", 14.0),
            ("dep-9", "product-catalog", "inventory-service", "sync_http", 15.0),
        ]

        for dep_id, src, tgt, call_type, lat in deps:
            db.add(ServiceDependency(
                id=dep_id,
                source_service_id=src,
                target_service_id=tgt,
                call_type=call_type,
                avg_latency_ms=lat
            ))
        db.commit()

        # 4. SLOs
        slos_data = [
            {
                "id": "slo-api-avail",
                "name": "ShopCloud API 99.90% Availability",
                "service_id": "shopcloud-api",
                "metric_type": "availability",
                "target_percentage": 99.90,
                "target_value": None,
                "time_window_days": 30,
                "warning_threshold": 99.92,
                "critical_threshold": 99.90,
                "description": "At least 99.90% of requests to API Gateway return HTTP status < 500 over 30 days."
            },
            {
                "id": "slo-api-latency",
                "name": "ShopCloud API P95 Latency ≤ 200ms",
                "service_id": "shopcloud-api",
                "metric_type": "latency_p95",
                "target_percentage": 99.00,
                "target_value": 200.0,
                "time_window_days": 30,
                "warning_threshold": 180.0,
                "critical_threshold": 200.0,
                "description": "P95 latency of API ingress requests must remain under 200ms."
            },
            {
                "id": "slo-payment-latency",
                "name": "Payment Service P95 Latency ≤ 300ms",
                "service_id": "payment-service",
                "metric_type": "latency_p95",
                "target_percentage": 99.00,
                "target_value": 300.0,
                "time_window_days": 30,
                "warning_threshold": 250.0,
                "critical_threshold": 300.0,
                "description": "99% of payment authorizations completed within 300ms."
            },
            {
                "id": "slo-payment-avail",
                "name": "Payment Service 99.95% Availability",
                "service_id": "payment-service",
                "metric_type": "availability",
                "target_percentage": 99.95,
                "target_value": None,
                "time_window_days": 30,
                "warning_threshold": 99.96,
                "critical_threshold": 99.95,
                "description": "Payment service 99.95% error-free uptime."
            },
            {
                "id": "slo-order-error",
                "name": "Order Service Error Rate ≤ 0.10%",
                "service_id": "order-service",
                "metric_type": "error_rate",
                "target_percentage": 99.90,
                "target_value": 0.10,
                "time_window_days": 30,
                "warning_threshold": 0.08,
                "critical_threshold": 0.10,
                "description": "Cart checkout and order generation HTTP error rate under 0.10%."
            },
            {
                "id": "slo-auth-avail",
                "name": "Auth Service 99.99% Availability",
                "service_id": "auth-service",
                "metric_type": "availability",
                "target_percentage": 99.99,
                "target_value": None,
                "time_window_days": 30,
                "warning_threshold": 99.992,
                "critical_threshold": 99.99,
                "description": "High-assurance auth service availability."
            },
            {
                "id": "slo-search-latency",
                "name": "Search Service P95 Latency ≤ 150ms",
                "service_id": "search-service",
                "metric_type": "latency_p95",
                "target_percentage": 99.00,
                "target_value": 150.0,
                "time_window_days": 30,
                "warning_threshold": 120.0,
                "critical_threshold": 150.0,
                "description": "Product search query response times."
            },
            {
                "id": "slo-catalog-avail",
                "name": "Product Catalog 99.90% Availability",
                "service_id": "product-catalog",
                "metric_type": "availability",
                "target_percentage": 99.90,
                "target_value": None,
                "time_window_days": 30,
                "warning_threshold": 99.92,
                "critical_threshold": 99.90,
                "description": "Catalog read queries availability."
            }
        ]

        for slo in slos_data:
            db.add(SLO(**slo))
        db.commit()

        # 5. SLAs
        slas_data = [
            {
                "id": "sla-ent-api",
                "name": "Enterprise Ingress Availability Agreement",
                "service_id": "shopcloud-api",
                "customer_tier": "Enterprise",
                "metric_type": "availability",
                "target_percentage": 99.50,
                "target_value": None,
                "current_compliance": 99.96,
                "status": "Compliant",
                "penalty_terms": "10% service credit for availability between 99.00% - 99.49%, 25% credit below 99.00%."
            },
            {
                "id": "sla-ent-payment",
                "name": "Enterprise Payment Processing SLA",
                "service_id": "payment-service",
                "customer_tier": "Enterprise",
                "metric_type": "availability",
                "target_percentage": 99.80,
                "target_value": None,
                "current_compliance": 99.98,
                "status": "Compliant",
                "penalty_terms": "15% billing credit for unannounced payment processor downtime exceeding 0.20%."
            },
            {
                "id": "sla-biz-orders",
                "name": "Business Tier Order Processing Guarantee",
                "service_id": "order-service",
                "customer_tier": "Business",
                "metric_type": "availability",
                "target_percentage": 99.00,
                "target_value": None,
                "current_compliance": 99.94,
                "status": "Compliant",
                "penalty_terms": "5% service credit for monthly downtime > 1.00%."
            },
            {
                "id": "sla-ent-latency",
                "name": "Enterprise API Latency SLA (P95 ≤ 500ms)",
                "service_id": "shopcloud-api",
                "customer_tier": "Enterprise",
                "metric_type": "latency_p95",
                "target_percentage": 99.00,
                "target_value": 500.0,
                "current_compliance": 99.95,
                "status": "Compliant",
                "penalty_terms": "Credit applied if P95 monthly response time exceeds 500ms for more than 2 consecutive hours."
            }
        ]

        for sla in slas_data:
            db.add(SLA(**sla))
        db.commit()

        # 6. Monitors
        monitors_data = [
            {
                "id": "mon-api-avail",
                "name": "API Gateway High Error Rate Monitor",
                "service_id": "shopcloud-api",
                "metric_type": "availability",
                "condition": "lt",
                "warning_threshold": 99.92,
                "critical_threshold": 99.50,
                "evaluation_window_minutes": 5,
                "severity": "critical",
                "is_enabled": True,
                "notification_channel": "#sre-alerts, PagerDuty P1",
                "description": "Fires if API Gateway availability drops below 99.92% (Warning) or 99.50% (Critical)."
            },
            {
                "id": "mon-payment-lat",
                "name": "Payment Service Latency Spike",
                "service_id": "payment-service",
                "metric_type": "latency_p95",
                "condition": "gt",
                "warning_threshold": 250.0,
                "critical_threshold": 500.0,
                "evaluation_window_minutes": 5,
                "severity": "critical",
                "is_enabled": True,
                "notification_channel": "#checkout-oncall, PagerDuty P1",
                "description": "Triggers alert if P95 payment processing takes longer than 250ms."
            },
            {
                "id": "mon-order-err",
                "name": "Order Checkout Failure Rate",
                "service_id": "order-service",
                "metric_type": "error_rate",
                "condition": "gt",
                "warning_threshold": 0.10,
                "critical_threshold": 0.50,
                "evaluation_window_minutes": 5,
                "severity": "warning",
                "is_enabled": True,
                "notification_channel": "#checkout-team",
                "description": "Monitors percentage of 5xx checkout failures."
            },
            {
                "id": "mon-auth-avail",
                "name": "Authentication Outage Detection",
                "service_id": "auth-service",
                "metric_type": "availability",
                "condition": "lt",
                "warning_threshold": 99.99,
                "critical_threshold": 99.50,
                "evaluation_window_minutes": 3,
                "severity": "critical",
                "is_enabled": True,
                "notification_channel": "#security-oncall, PagerDuty P1",
                "description": "Immediate critical escalation if authentication service degrades."
            },
            {
                "id": "mon-search-lat",
                "name": "Search Engine Slow Query Monitor",
                "service_id": "search-service",
                "metric_type": "latency_p95",
                "condition": "gt",
                "warning_threshold": 160.0,
                "critical_threshold": 300.0,
                "evaluation_window_minutes": 10,
                "severity": "warning",
                "is_enabled": True,
                "notification_channel": "#search-team",
                "description": "Alerts if search query P95 degrades."
            }
        ]

        for m in monitors_data:
            db.add(Monitor(**m))
        db.commit()

        # 7. Seed 30 Days of Metrics
        print("Generating 30 days of high-fidelity time-series telemetry...")
        now = datetime.datetime.utcnow().replace(second=0, microsecond=0)
        
        # We will generate hourly points for the last 30 days (720 hours)
        # plus higher resolution 5-minute points for the last 6 hours (72 points)
        base_configs = {
            "shopcloud-api": {"base_rps": 1250.0, "base_err": 0.03, "base_p50": 35.0, "base_p95": 110.0, "base_p99": 180.0, "base_avail": 99.97, "cpu": 42.0, "mem": 58.0},
            "auth-service": {"base_rps": 820.0, "base_err": 0.01, "base_p50": 12.0, "base_p95": 28.0, "base_p99": 45.0, "base_avail": 99.99, "cpu": 35.0, "mem": 48.0},
            "payment-service": {"base_rps": 340.0, "base_err": 0.02, "base_p50": 85.0, "base_p95": 180.0, "base_p99": 260.0, "base_avail": 99.98, "cpu": 48.0, "mem": 64.0},
            "order-service": {"base_rps": 480.0, "base_err": 0.04, "base_p50": 45.0, "base_p95": 130.0, "base_p99": 210.0, "base_avail": 99.96, "cpu": 52.0, "mem": 68.0},
            "product-catalog": {"base_rps": 950.0, "base_err": 0.02, "base_p50": 20.0, "base_p95": 65.0, "base_p99": 115.0, "base_avail": 99.98, "cpu": 38.0, "mem": 55.0},
            "search-service": {"base_rps": 620.0, "base_err": 0.05, "base_p50": 38.0, "base_p95": 95.0, "base_p99": 160.0, "base_avail": 99.95, "cpu": 65.0, "mem": 72.0},
            "inventory-service": {"base_rps": 410.0, "base_err": 0.02, "base_p50": 18.0, "base_p95": 55.0, "base_p99": 90.0, "base_avail": 99.98, "cpu": 32.0, "mem": 46.0},
            "notification-service": {"base_rps": 180.0, "base_err": 0.06, "base_p50": 15.0, "base_p95": 48.0, "base_p99": 85.0, "base_avail": 99.94, "cpu": 25.0, "mem": 38.0},
        }

        # Deterministic seed for reproducible demo data
        rng = random.Random(42)

        # Generate 30 days of hourly points
        metric_records = []
        for hour_offset in range(30 * 24, 6, -1):
            t = now - datetime.timedelta(hours=hour_offset)
            # Diurnal traffic cycle (sinusoidal day/night wave)
            diurnal = 0.7 + 0.3 * math.sin((t.hour - 6) / 24.0 * 2 * math.pi)
            
            # Minor past disturbance around 12 days ago
            past_blip = (12 * 24 <= hour_offset <= 12 * 24 + 3)

            for s_id, cfg in base_configs.items():
                jitter = rng.uniform(0.95, 1.05)
                rps = round(cfg["base_rps"] * diurnal * jitter, 1)
                
                if past_blip and s_id in ["order-service", "shopcloud-api"]:
                    err = round(cfg["base_err"] + 0.15 * rng.uniform(0.8, 1.2), 3)
                    p95 = round(cfg["base_p95"] * 1.6 * jitter, 1)
                    avail = round(max(99.0, 100.0 - err), 3)
                else:
                    err = round(cfg["base_err"] * rng.uniform(0.8, 1.2), 3)
                    p95 = round(cfg["base_p95"] * jitter, 1)
                    avail = round(max(99.8, 100.0 - err), 3)

                metric_records.append(Metric(
                    service_id=s_id,
                    timestamp=t,
                    requests_per_sec=rps,
                    error_rate=err,
                    p50_latency=round(cfg["base_p50"] * jitter, 1),
                    p95_latency=p95,
                    p99_latency=round(cfg["base_p99"] * jitter, 1),
                    availability=avail,
                    cpu_percent=round(cfg["cpu"] * diurnal * jitter, 1),
                    memory_percent=round(cfg["mem"] + rng.uniform(-2, 2), 1)
                ))

        # Generate last 6 hours in 5-minute increments (high resolution)
        for min_offset in range(6 * 60, -1, -5):
            t = now - datetime.timedelta(minutes=min_offset)
            diurnal = 0.7 + 0.3 * math.sin((t.hour + t.minute / 60.0 - 6) / 24.0 * 2 * math.pi)

            for s_id, cfg in base_configs.items():
                jitter = rng.uniform(0.96, 1.04)
                rps = round(cfg["base_rps"] * diurnal * jitter, 1)
                err = round(cfg["base_err"] * rng.uniform(0.85, 1.15), 3)
                p95 = round(cfg["base_p95"] * jitter, 1)
                avail = round(max(99.85, 100.0 - err), 3)

                metric_records.append(Metric(
                    service_id=s_id,
                    timestamp=t,
                    requests_per_sec=rps,
                    error_rate=err,
                    p50_latency=round(cfg["base_p50"] * jitter, 1),
                    p95_latency=p95,
                    p99_latency=round(cfg["base_p99"] * jitter, 1),
                    availability=avail,
                    cpu_percent=round(cfg["cpu"] * diurnal * jitter, 1),
                    memory_percent=round(cfg["mem"] + rng.uniform(-1, 1), 1)
                ))

        db.bulk_save_objects(metric_records)
        db.commit()

        # 8. Historical Alerts
        alerts_data = [
            {
                "id": "alt-hist-01",
                "monitor_id": "mon-api-avail",
                "service_id": "shopcloud-api",
                "slo_id": "slo-api-avail",
                "severity": "warning",
                "status": "resolved",
                "title": "ShopCloud API Availability Degradation",
                "description": "Availability dipped to 99.88% during Redis cache failover 12 days ago.",
                "metric_type": "availability",
                "current_value": 99.88,
                "threshold_value": 99.92,
                "started_at": now - datetime.timedelta(days=12, hours=3),
                "acknowledged_at": now - datetime.timedelta(days=12, hours=2, minutes=50),
                "resolved_at": now - datetime.timedelta(days=12, hours=2),
                "acknowledged_by": "Sarah Chen (Lead SRE)"
            },
            {
                "id": "alt-hist-02",
                "monitor_id": "mon-search-lat",
                "service_id": "search-service",
                "slo_id": "slo-search-latency",
                "severity": "warning",
                "status": "resolved",
                "title": "Search Query Latency Warning",
                "description": "P95 latency elevated to 175ms during bulk product catalog reindexing.",
                "metric_type": "latency_p95",
                "current_value": 175.0,
                "threshold_value": 160.0,
                "started_at": now - datetime.timedelta(days=5, hours=8),
                "acknowledged_at": now - datetime.timedelta(days=5, hours=7, minutes=45),
                "resolved_at": now - datetime.timedelta(days=5, hours=6),
                "acknowledged_by": "Alex Morgan (SRE)"
            }
        ]

        for a in alerts_data:
            db.add(Alert(**a))
        db.commit()

        # 9. Historical Incidents
        incidents_data = [
            {
                "id": "INC-2026-0812",
                "title": "Degraded API Availability due to Cluster Redis Failover",
                "severity": "medium",
                "status": "resolved",
                "summary": "Transient network partition between primary Redis node and API Gateway cache proxy caused elevated 502 Bad Gateway responses.",
                "impact": "1,840 requests experienced retry latency; 0.12% error rate spike over 45 minutes.",
                "root_cause": "AWS Elasticache automated multi-AZ DNS swap took 180 seconds longer than timeout settings allowed.",
                "primary_service_id": "shopcloud-api",
                "affected_services": ["shopcloud-api", "order-service"],
                "lead_sre": "Sarah Chen (Lead SRE)",
                "started_at": now - datetime.timedelta(days=12, hours=3),
                "resolved_at": now - datetime.timedelta(days=12, hours=2),
                "timeline": [
                    {"timestamp": (now - datetime.timedelta(days=12, hours=3)).isoformat(), "message": "Automated alert mon-api-avail triggered (Availability: 99.88%).", "author": "AlertEngine", "type": "metric_alert"},
                    {"timestamp": (now - datetime.timedelta(days=12, hours=2, minutes=50)).isoformat(), "message": "Incident declared by Sarah Chen. Primary on-call team engaged.", "author": "Sarah Chen", "type": "status_change"},
                    {"timestamp": (now - datetime.timedelta(days=12, hours=2, minutes=20)).isoformat(), "message": "Redis cache connection pool reset; traffic re-routed to hot standby replica.", "author": "Alex Morgan", "type": "action_item"},
                    {"timestamp": (now - datetime.timedelta(days=12, hours=2)).isoformat(), "message": "Error rates returned to nominal baseline (0.02%). Incident resolved.", "author": "Sarah Chen", "type": "status_change"}
                ]
            }
        ]

        for inc in incidents_data:
            db.add(Incident(**inc))
        db.commit()

        # 10. Sample Seed Logs
        print("Seeding application logs and traces...")
        sample_logs = [
            {"id": "log-101", "service_id": "shopcloud-api", "level": "INFO", "message": "HTTP 200 GET /api/v1/catalog/items?page=1 - 24ms", "request_id": "REQ-77401", "http_method": "GET", "http_status": 200, "duration_ms": 24.2, "metadata_json": {"ip": "198.51.100.4", "user_agent": "Mozilla/5.0"}},
            {"id": "log-102", "service_id": "auth-service", "level": "INFO", "message": "Token verification succeeded for user_id=usr_99812", "request_id": "REQ-77401", "http_method": "POST", "http_status": 200, "duration_ms": 11.5, "metadata_json": {"scope": "read:catalog"}},
            {"id": "log-103", "service_id": "product-catalog", "level": "INFO", "message": "Cache hit key=prod_cat_top_deals limit=20", "request_id": "REQ-77401", "http_method": "GET", "http_status": 200, "duration_ms": 6.8, "metadata_json": {"items_returned": 20}},
            {"id": "log-104", "service_id": "shopcloud-api", "level": "INFO", "message": "HTTP 200 POST /api/v1/orders/checkout - 145ms", "request_id": "REQ-77402", "http_method": "POST", "http_status": 200, "duration_ms": 145.0, "metadata_json": {"cart_items": 3, "total_cents": 12900}},
            {"id": "log-105", "service_id": "order-service", "level": "INFO", "message": "Processing checkout intent cart_id=crt_44019", "request_id": "REQ-77402", "http_method": "POST", "http_status": 200, "duration_ms": 85.0, "metadata_json": {"user_id": "usr_99812"}},
            {"id": "log-106", "service_id": "payment-service", "level": "INFO", "message": "Stripe charge approved charge_id=ch_39482910 amount=129.00 currency=USD", "request_id": "REQ-77402", "http_method": "POST", "http_status": 200, "duration_ms": 52.0, "metadata_json": {"gateway": "stripe"}},
            {"id": "log-107", "service_id": "inventory-service", "level": "INFO", "message": "Stock reservation committed items=[sku_881:1, sku_994:2]", "request_id": "REQ-77402", "http_method": "POST", "http_status": 200, "duration_ms": 18.2, "metadata_json": {"warehouse": "us-east-1"}},
            {"id": "log-108", "service_id": "notification-service", "level": "INFO", "message": "Order confirmation email queued email=customer@example.com template=order_success", "request_id": "REQ-77402", "http_method": "POST", "http_status": 202, "duration_ms": 8.1, "metadata_json": {"queue": "priority_email"}},
            {"id": "log-109", "service_id": "search-service", "level": "WARN", "message": "Slow query execution index=products query='wireless noise cancelling headphones' took 118ms", "request_id": "REQ-77403", "http_method": "GET", "http_status": 200, "duration_ms": 118.0, "metadata_json": {"total_hits": 412}},
            {"id": "log-110", "service_id": "shopcloud-api", "level": "INFO", "message": "Health probe check status=UP region=us-east-1", "request_id": "REQ-HEALTH", "http_method": "GET", "http_status": 200, "duration_ms": 2.1, "metadata_json": {"k8s_pod": "shopcloud-api-7b8f9c-29d"}}
        ]

        for l in sample_logs:
            db.add(LogEntry(
                id=l["id"],
                service_id=l["service_id"],
                timestamp=now - datetime.timedelta(minutes=rng.randint(2, 45)),
                level=l["level"],
                message=l["message"],
                request_id=l["request_id"],
                http_method=l["http_method"],
                http_status=l["http_status"],
                duration_ms=l["duration_ms"],
                metadata_json=l["metadata_json"]
            ))
        db.commit()

        # 11. Sample Simulated Traces
        traces_data = [
            {
                "id": "trc-checkout-8841",
                "root_service_id": "shopcloud-api",
                "operation_name": "POST /api/v1/orders/checkout",
                "timestamp": now - datetime.timedelta(minutes=14),
                "total_duration_ms": 142.5,
                "http_status": 200,
                "has_error": False,
                "user_id": "usr_99812",
                "spans": [
                    {"id": "spn-101", "parent_span_id": None, "service_id": "shopcloud-api", "span_name": "API Gateway Ingress", "start_offset_ms": 0.0, "duration_ms": 142.5, "status": "ok", "tags": {"http.url": "/api/v1/orders/checkout", "http.method": "POST"}},
                    {"id": "spn-102", "parent_span_id": "spn-101", "service_id": "auth-service", "span_name": "VerifyAuthSession", "start_offset_ms": 4.0, "duration_ms": 15.2, "status": "ok", "tags": {"auth.type": "JWT", "user_id": "usr_99812"}},
                    {"id": "spn-103", "parent_span_id": "spn-101", "service_id": "order-service", "span_name": "OrderService.CreateOrder", "start_offset_ms": 22.0, "duration_ms": 115.0, "status": "ok", "tags": {"cart.id": "crt_44019"}},
                    {"id": "spn-104", "parent_span_id": "spn-103", "service_id": "payment-service", "span_name": "PaymentService.AuthorizeStripe", "start_offset_ms": 32.0, "duration_ms": 68.0, "status": "ok", "tags": {"payment.provider": "stripe", "amount_usd": 129.00}},
                    {"id": "spn-105", "parent_span_id": "spn-103", "service_id": "inventory-service", "span_name": "InventoryService.ReserveStock", "start_offset_ms": 102.0, "duration_ms": 22.5, "status": "ok", "tags": {"sku_count": 2}},
                    {"id": "spn-106", "parent_span_id": "spn-103", "service_id": "notification-service", "span_name": "NotificationService.EnqueueEmail", "start_offset_ms": 126.0, "duration_ms": 8.0, "status": "ok", "tags": {"queue": "kafka_order_events"}}
                ]
            },
            {
                "id": "trc-search-9912",
                "root_service_id": "shopcloud-api",
                "operation_name": "GET /api/v1/search?q=running+shoes",
                "timestamp": now - datetime.timedelta(minutes=28),
                "total_duration_ms": 86.4,
                "http_status": 200,
                "has_error": False,
                "user_id": "usr_anon_441",
                "spans": [
                    {"id": "spn-201", "parent_span_id": None, "service_id": "shopcloud-api", "span_name": "API Gateway Ingress", "start_offset_ms": 0.0, "duration_ms": 86.4, "status": "ok", "tags": {"http.url": "/api/v1/search"}},
                    {"id": "spn-202", "parent_span_id": "spn-201", "service_id": "search-service", "span_name": "SearchService.ExecuteQuery", "start_offset_ms": 6.0, "duration_ms": 74.0, "status": "ok", "tags": {"query": "running shoes", "hits": 84}},
                    {"id": "spn-203", "parent_span_id": "spn-202", "service_id": "product-catalog", "span_name": "ProductCatalog.HydrateMetadata", "start_offset_ms": 42.0, "duration_ms": 32.0, "status": "ok", "tags": {"ids_count": 20}}
                ]
            }
        ]

        for trc in traces_data:
            spans = trc.pop("spans")
            trace_obj = Trace(**trc)
            db.add(trace_obj)
            db.commit()
            for sp in spans:
                db.add(TraceSpan(trace_id=trace_obj.id, **sp))
        db.commit()

        # 12. Dashboards
        db.add(Dashboard(
            id="dash-prod-overview",
            title="ShopCloud Production Overview",
            description="Executive SRE dashboard displaying real-time availability, error budget burn rates, latency percentiles, and SLA health.",
            is_default=True,
            tags=["production", "sre", "executive", "slos"],
            layout_config=[
                {"id": "widget-kpi-grid", "type": "kpi_grid", "w": 12, "h": 4},
                {"id": "widget-service-health", "type": "service_health_table", "w": 12, "h": 6},
                {"id": "widget-latency-overview", "type": "latency_percentiles", "w": 6, "h": 6},
                {"id": "widget-error-budgets", "type": "error_budget_gauges", "w": 6, "h": 6}
            ]
        ))
        db.commit()

        # 13. Seed Notifications
        notifications_data = [
            {"id": "ntf-01", "title": "System Operating at Peak Reliability", "message": "All 8 core microservices are compliant with 30-day SLO commitments (99.95% aggregate availability).", "type": "system", "severity": "info", "link": "/slos", "is_read": False},
            {"id": "ntf-02", "title": "SLO 30-Day Evaluation Completed", "message": "ShopCloud API Gateway 99.90% availability target maintained with 68% error budget remaining.", "type": "slo_breach", "severity": "info", "link": "/error-budgets", "is_read": False}
        ]

        for n in notifications_data:
            db.add(Notification(
                id=n["id"],
                title=n["title"],
                message=n["message"],
                type=n["type"],
                severity=n["severity"],
                link=n["link"],
                is_read=n["is_read"],
                created_at=now - datetime.timedelta(hours=1)
            ))
        db.commit()

        print("Database seed completed successfully!")

    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    seed_database()
