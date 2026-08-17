import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.dashboard import Dashboard
from app.schemas.dashboard import DashboardRead, DashboardCreate, DashboardUpdate

router = APIRouter()

@router.get("", response_model=List[DashboardRead])
def list_dashboards(db: Session = Depends(get_db)):
    dashboards = db.query(Dashboard).order_by(Dashboard.created_at.desc()).all()
    return [
        DashboardRead(
            id=d.id,
            title=d.title,
            description=d.description,
            is_default=d.is_default,
            tags=d.tags or [],
            layout_config=d.layout_config or [],
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        for d in dashboards
    ]

@router.get("/{dashboard_id}", response_model=DashboardRead)
def get_dashboard(dashboard_id: str, db: Session = Depends(get_db)):
    d = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    return DashboardRead(
        id=d.id,
        title=d.title,
        description=d.description,
        is_default=d.is_default,
        tags=d.tags or [],
        layout_config=d.layout_config or [],
        created_at=d.created_at,
        updated_at=d.updated_at
    )

@router.post("", response_model=DashboardRead, status_code=201)
def create_dashboard(payload: DashboardCreate, db: Session = Depends(get_db)):
    dash_id = f"dash-{uuid.uuid4().hex[:8]}"
    new_dash = Dashboard(
        id=dash_id,
        title=payload.title,
        description=payload.description,
        is_default=payload.is_default,
        tags=payload.tags,
        layout_config=payload.layout_config
    )
    db.add(new_dash)
    db.commit()
    db.refresh(new_dash)

    return get_dashboard(new_dash.id, db)

@router.put("/{dashboard_id}", response_model=DashboardRead)
def update_dashboard(dashboard_id: str, payload: DashboardUpdate, db: Session = Depends(get_db)):
    d = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(d, field, val)

    db.commit()
    db.refresh(d)

    return get_dashboard(d.id, db)

@router.delete("/{dashboard_id}", status_code=204)
def delete_dashboard(dashboard_id: str, db: Session = Depends(get_db)):
    d = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    db.delete(d)
    db.commit()
    return None
