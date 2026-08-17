import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_overview_kpis():
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert "system_health_score" in data
    assert "slo_compliance_percent" in data
    assert "active_incidents_count" in data
    assert "sparklines" in data

def test_services_list():
    response = client.get("/api/v1/services")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 8
    assert any(s["id"] == "shopcloud-api" for s in data)

def test_slos_and_error_budgets():
    response = client.get("/api/v1/slos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

    budget_resp = client.get("/api/v1/slos/error-budgets")
    assert budget_resp.status_code == 200
    budget_data = budget_resp.json()
    assert "budget_remaining_overall_percent" in budget_data

def test_simulation_endpoints():
    # Test degraded simulation
    sim_resp = client.post("/api/v1/simulation/simulate")
    assert sim_resp.status_code == 200
    assert sim_resp.json()["simulation_mode"] == "incident"

    # Verify overview picks up degraded status
    ov_resp = client.get("/api/v1/overview")
    assert ov_resp.status_code == 200

    # Reset back to normal
    reset_resp = client.post("/api/v1/simulation/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["simulation_mode"] == "normal"
