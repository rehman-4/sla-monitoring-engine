import pytest
from app.db.database import SessionLocal
from app.engine.budget_engine import get_error_budget_overview

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_get_error_budget_overview(db_session):
    overview = get_error_budget_overview(db_session)
    assert "allowed_budget_total" in overview
    assert "consumed_budget_total" in overview
    assert "budget_remaining_overall_percent" in overview
    assert "services_consuming_most" in overview
    assert overview["budget_remaining_overall_percent"] >= 0.0
    assert overview["budget_remaining_overall_percent"] <= 100.0
