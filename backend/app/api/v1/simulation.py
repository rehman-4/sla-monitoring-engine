from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.engine.simulation_engine import (
    trigger_normal_state,
    trigger_degraded_incident,
    trigger_critical_incident,
    get_current_simulation_mode
)

router = APIRouter()

@router.get("/status")
def get_status(db: Session = Depends(get_db)):
    mode = get_current_simulation_mode(db)
    return {
        "simulation_mode": mode,
        "is_active_incident": mode in ["incident", "critical_incident"],
        "severity": "critical" if mode == "critical_incident" else ("warning" if mode == "incident" else "normal")
    }

@router.post("/simulate")
def simulate_warning_incident(db: Session = Depends(get_db)):
    return trigger_degraded_incident(db)

@router.post("/simulate-critical")
def simulate_critical_incident(db: Session = Depends(get_db)):
    return trigger_critical_incident(db)

@router.post("/reset")
def reset_to_normal(db: Session = Depends(get_db)):
    return trigger_normal_state(db)
