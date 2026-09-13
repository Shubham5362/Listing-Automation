import json
import logging
import time
from collections import Counter
from threading import Lock


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "request_id"):
            payload["request_id"] = record.request_id
        return json.dumps(payload, ensure_ascii=False)


_metrics = Counter()
_metrics_lock = Lock()


def configure_logging() -> None:
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    if not root.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        root.addHandler(handler)


def record_request(method: str, path: str, status_code: int, duration_ms: float) -> None:
    with _metrics_lock:
        _metrics["requests_total"] += 1
        _metrics[f"requests_{status_code // 100}xx"] += 1
        _metrics[f"route_{method}_{path}"] += 1
        if duration_ms >= 1000:
            _metrics["requests_slow"] += 1


def metrics_snapshot() -> dict[str, int]:
    with _metrics_lock:
        return dict(_metrics)
