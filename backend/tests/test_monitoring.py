from app.core.observability import prometheus_snapshot
from app.services.monitoring import MonitoringService


def test_monitoring_stays_clear_below_minimum_sample():
    assert MonitoringService().evaluate({"requests_total": 19, "requests_5xx": 19}) == []


def test_monitoring_detects_high_5xx_rate():
    alerts = MonitoringService().evaluate({"requests_total": 100, "requests_5xx": 5})
    assert [item["rule"] for item in alerts] == ["http_5xx_rate"]
    assert alerts[0]["severity"] == "critical"


def test_monitoring_detects_latency_and_rate_limit_pressure():
    alerts = MonitoringService().evaluate({"requests_total": 100, "requests_slow": 20, "requests_429": 10})
    assert {item["rule"] for item in alerts} == {"http_slow_rate", "rate_limited_requests"}


def test_prometheus_snapshot_is_dependency_free_and_stable():
    payload = prometheus_snapshot()
    assert "seller_hub_requests_total" in payload
    assert "seller_hub_requests_5xx" in payload
