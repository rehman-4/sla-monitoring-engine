import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service import Service, ServiceDependency
from app.models.alert import Alert
from app.models.slo import SLO
from app.engine.sli_calculator import calculate_service_slis
from app.engine.slo_evaluator import evaluate_all_slos
from app.schemas.service import (
    ServiceRead, ServiceCreate, ServiceUpdate,
    ServiceTopology, ServiceTopologyNode, ServiceTopologyEdge
)

router = APIRouter()

@router.get("", response_model=List[ServiceRead])
def list_services(time_range: str = Query("24h"), db: Session = Depends(get_db)):
    services = db.query(Service).all()
    results = []

    for s in services:
        slis = calculate_service_slis(db, s.id, time_range)
        active_alerts = (
            db.query(Alert)
            .filter(Alert.service_id == s.id, Alert.status.in_(["open", "acknowledged"]))
            .count()
        )
        active_slos = db.query(SLO).filter(SLO.service_id == s.id, SLO.is_active == True).count()

        results.append(ServiceRead(
            id=s.id,
            name=s.name,
            slug=s.slug,
            tier=s.tier,
            status=s.status,
            description=s.description,
            owner_team=s.owner_team,
            environment=s.environment,
            created_at=s.created_at,
            availability=slis["availability"],
            requests_per_sec=slis["requests_per_sec"],
            error_rate=slis["error_rate"],
            p50_latency=slis["p50_latency"],
            p95_latency=slis["p95_latency"],
            p99_latency=slis["p99_latency"],
            active_alerts_count=active_alerts,
            active_slos_count=active_slos,
            error_budget_remaining=round(max(0.0, 100.0 - (slis["error_rate"] / 0.10 * 100.0)), 1)
        ))

    return results

@router.get("/topology", response_model=ServiceTopology)
def get_service_topology(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    dependencies = db.query(ServiceDependency).all()

    # Pre-calculated node coordinates for balanced topological map layout
    coords = {
        "shopcloud-api": (450, 80),
        "auth-service": (180, 220),
        "product-catalog": (450, 220),
        "order-service": (720, 220),
        "search-service": (180, 380),
        "inventory-service": (450, 380),
        "payment-service": (720, 380),
        "notification-service": (920, 380)
    }

    nodes = []
    for s in services:
        slis = calculate_service_slis(db, s.id, "1h")
        active_alerts = (
            db.query(Alert)
            .filter(Alert.service_id == s.id, Alert.status.in_(["open", "acknowledged"]))
            .count()
        )
        x, y = coords.get(s.id, (400, 300))

        nodes.append(ServiceTopologyNode(
            id=s.id,
            name=s.name,
            tier=s.tier,
            status=s.status,
            availability=slis["availability"],
            requests_per_sec=slis["requests_per_sec"],
            p95_latency=slis["p95_latency"],
            error_rate=slis["error_rate"],
            error_budget_remaining=round(max(0.0, 100.0 - (slis["error_rate"] / 0.10 * 100.0)), 1),
            active_alerts=active_alerts,
            x=float(x),
            y=float(y)
        ))

    edges = [
        ServiceTopologyEdge(
            id=d.id,
            source=d.source_service_id,
            target=d.target_service_id,
            call_type=d.call_type,
            avg_latency_ms=d.avg_latency_ms
        )
        for d in dependencies
    ]

    return ServiceTopology(nodes=nodes, edges=edges)

@router.get("/{service_id}", response_model=ServiceRead)
def get_service_by_id(service_id: str, time_range: str = Query("24h"), db: Session = Depends(get_db)):
    s = db.query(Service).filter(Service.id == service_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Service not found")

    slis = calculate_service_slis(db, s.id, time_range)
    active_alerts = (
        db.query(Alert)
        .filter(Alert.service_id == s.id, Alert.status.in_(["open", "acknowledged"]))
        .count()
    )
    active_slos = db.query(SLO).filter(SLO.service_id == s.id, SLO.is_active == True).count()

    return ServiceRead(
        id=s.id,
        name=s.name,
        slug=s.slug,
        tier=s.tier,
        status=s.status,
        description=s.description,
        owner_team=s.owner_team,
        environment=s.environment,
        created_at=s.created_at,
        availability=slis["availability"],
        requests_per_sec=slis["requests_per_sec"],
        error_rate=slis["error_rate"],
        p50_latency=slis["p50_latency"],
        p95_latency=slis["p95_latency"],
        p99_latency=slis["p99_latency"],
        active_alerts_count=active_alerts,
        active_slos_count=active_slos,
        error_budget_remaining=round(max(0.0, 100.0 - (slis["error_rate"] / 0.10 * 100.0)), 1)
    )

@router.post("", response_model=ServiceRead, status_code=201)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    slug = payload.name.lower().replace(" ", "-")
    service_id = slug
    
    if db.query(Service).filter(Service.id == service_id).first():
        raise HTTPException(status_code=400, detail="Service with this identifier already exists")

    new_service = Service(
        id=service_id,
        name=payload.name,
        slug=slug,
        tier=payload.tier,
        status="healthy",
        description=payload.description,
        owner_team=payload.owner_team,
        environment=payload.environment
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return ServiceRead(
        id=new_service.id,
        name=new_service.name,
        slug=new_service.slug,
        tier=new_service.tier,
        status=new_service.status,
        description=new_service.description,
        owner_team=new_service.owner_team,
        environment=new_service.environment,
        created_at=new_service.created_at,
        availability=99.95,
        requests_per_sec=100.0,
        error_rate=0.02,
        p50_latency=30.0,
        p95_latency=80.0,
        p99_latency=120.0,
        active_alerts_count=0,
        active_slos_count=0,
        error_budget_remaining=80.0
    )
