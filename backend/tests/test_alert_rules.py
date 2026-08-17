import pytest
from app.engine.alert_engine import evaluate_monitor_rule

def test_evaluate_monitor_rule_lt():
    # Target < 99.92 (Warning), < 99.50 (Critical)
    # Healthy: 99.95
    breached, sev, thresh = evaluate_monitor_rule("lt", 99.95, 99.92, 99.50)
    assert not breached

    # Warning: 99.70
    breached, sev, thresh = evaluate_monitor_rule("lt", 99.70, 99.92, 99.50)
    assert breached
    assert sev == "warning"
    assert thresh == 99.92

    # Critical: 99.40
    breached, sev, thresh = evaluate_monitor_rule("lt", 99.40, 99.92, 99.50)
    assert breached
    assert sev == "critical"
    assert thresh == 99.50

def test_evaluate_monitor_rule_gt():
    # Latency > 200 (Warning), > 500 (Critical)
    # Healthy: 120ms
    breached, sev, thresh = evaluate_monitor_rule("gt", 120.0, 200.0, 500.0)
    assert not breached

    # Warning: 250ms
    breached, sev, thresh = evaluate_monitor_rule("gt", 250.0, 200.0, 500.0)
    assert breached
    assert sev == "warning"

    # Critical: 600ms
    breached, sev, thresh = evaluate_monitor_rule("gt", 600.0, 200.0, 500.0)
    assert breached
    assert sev == "critical"
