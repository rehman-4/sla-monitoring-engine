import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.slo import SLO
from app.models.service import Service
from app.engine.slo_evaluator import evaluate_all_slos, evaluate_single_slo
from app.engine.budget_engine import get_error_budget_overview
from app.schemas.slo import SLORead, SLOCreate, SLOUpdate

router = APIRouter()

@router.get("", response_model=List[SLORead])
def list_slos(db: Session = Depends(get_db)):
    evaluated = evaluate_all_slos(db)
    return [SLORead(**e) for e in evaluated]

@router.get("/error-budgets")
def get_error_budgets(db: Session = Depends(get_db)):
    return get_error_budget_overview(db)

@router.get("/{slo_id}", response_model=SLORead)
def get_slo(slo_id: str, db: Session = Depends(get_db)):
    slo = db.query(SLO).filter(SLO.id == slo_id).first()
    if not slo:
        raise HTTPException(status_code=404, detail="SLO not found")
    evaluated = evaluate_single_slo(db, slo)
    return SLORead(**evaluated)

@router.post("", response_model=SLORead, status_code=201)
def create_slo(payload: SLOCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=400, detail="Associated Service does not exist")

    slo_id = f"slo-{uuid.uuid4().hex[:8]}"
    new_slo = SLO(
        id=slo_id,
        name=payload.name,
        service_id=payload.service_id,
        metric_type=payload.metric_type,
        target_percentage=payload.target_percentage,
        target_value=payload.target_value,
        time_window_days=payload.time_window_days,
        warning_threshold=payload.warning_threshold,
        critical_threshold=payload.critical_threshold,
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(new_slo)
    db.commit()
    db.refresh(new_slo)

    evaluated = evaluate_single_slo(db, new_slo)
    return SLORead(**evaluated)

@router.put("/{slo_id}", response_model=SLORead)
def update_slo(slo_id: str, payload: SLOUpdate, db: Session = Depends(get_db)):
    slo = db.query(SLO).filter(SLO.id == slo_id).first()
    if not slo:
        raise HTTPException(status_code=404, detail="SLO not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(slo, field, val)

    db.commit()
    db.refresh(slo)

    evaluated = evaluate_single_slo(db, slo)
    return SLORead(**evaluated)

@router.delete("/{slo_id}", status_code=204)
def delete_slo(slo_id: str, db: Session = Depends(get_db)):
    slo = db.query(SLO).filter(SLO.id == slo_id).first()
    if not slo:
        raise HTTPException(status_code=404, detail="SLO not found")

    db.delete(slo)
    db.commit()
    return None
