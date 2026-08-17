import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.sla import SLA
from app.models.service import Service
from app.engine.sla_evaluator import evaluate_all_slas, evaluate_single_sla
from app.schemas.sla import SLARead, SLACreate, SLAUpdate

router = APIRouter()

@router.get("", response_model=List[SLARead])
def list_slas(db: Session = Depends(get_db)):
    evaluated = evaluate_all_slas(db)
    return [SLARead(**e) for e in evaluated]

@router.post("", response_model=SLARead, status_code=201)
def create_sla(payload: SLACreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=400, detail="Associated Service does not exist")

    sla_id = f"sla-{uuid.uuid4().hex[:8]}"
    new_sla = SLA(
        id=sla_id,
        name=payload.name,
        service_id=payload.service_id,
        customer_tier=payload.customer_tier,
        metric_type=payload.metric_type,
        target_percentage=payload.target_percentage,
        target_value=payload.target_value,
        penalty_terms=payload.penalty_terms
    )
    db.add(new_sla)
    db.commit()
    db.refresh(new_sla)

    evaluated = evaluate_single_sla(db, new_sla)
    return SLARead(**evaluated)

@router.put("/{sla_id}", response_model=SLARead)
def update_sla(sla_id: str, payload: SLAUpdate, db: Session = Depends(get_db)):
    sla = db.query(SLA).filter(SLA.id == sla_id).first()
    if not sla:
        raise HTTPException(status_code=404, detail="SLA not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(sla, field, val)

    db.commit()
    db.refresh(sla)

    evaluated = evaluate_single_sla(db, sla)
    return SLARead(**evaluated)

@router.delete("/{sla_id}", status_code=204)
def delete_sla(sla_id: str, db: Session = Depends(get_db)):
    sla = db.query(SLA).filter(SLA.id == sla_id).first()
    if not sla:
        raise HTTPException(status_code=404, detail="SLA not found")

    db.delete(sla)
    db.commit()
    return None
