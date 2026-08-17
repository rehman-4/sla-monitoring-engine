import pytest
from app.db.database import SessionLocal, Base, engine
from app.engine.sli_calculator import calculate_service_slis, calculate_aggregate_system_slis

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def test_sli_calculations_returns_expected_fields(db_session):
    slis = calculate_service_slis(db_session, "shopcloud-api", "24h")
    assert "availability" in slis
    assert "error_rate" in slis
    assert "p95_latency" in slis
    assert "requests_per_sec" in slis
    assert slis["availability"] >= 99.0
    assert slis["error_rate"] >= 0.0

def test_aggregate_system_slis(db_session):
    agg = calculate_aggregate_system_slis(db_session, "24h")
    assert "system_health_score" in agg
    assert "availability" in agg
    assert "availability_target" in agg
    assert agg["status"] in ["healthy", "warning", "critical"]
    assert agg["availability"] > 90.0
