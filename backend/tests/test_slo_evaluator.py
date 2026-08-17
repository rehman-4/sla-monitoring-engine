import pytest
from app.db.database import SessionLocal
from app.models.slo import SLO
from app.engine.slo_evaluator import evaluate_all_slos, calculate_overall_slo_compliance

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_evaluate_all_slos(db_session):
    evaluated = evaluate_all_slos(db_session)
    assert len(evaluated) > 0
    first = evaluated[0]
    assert "id" in first
    assert "name" in first
    assert "current_compliance" in first
    assert "error_budget_remaining_percent" in first
    assert "status" in first
    assert first["status"] in ["PASS", "WARNING", "BREACHED"]

def test_overall_slo_compliance(db_session):
    compliance = calculate_overall_slo_compliance(db_session)
    assert 0.0 <= compliance <= 100.0
