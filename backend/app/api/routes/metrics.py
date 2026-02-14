"""
Prometheus-compatible metrics endpoint.
Exposes request counts, latencies, and business metrics.
"""
import time
from collections import defaultdict
from fastapi import APIRouter, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

router = APIRouter(tags=["monitoring"])

# In-memory counters (production: use prometheus_client library)
_request_count: dict[str, int] = defaultdict(int)
_request_latency_sum: dict[str, float] = defaultdict(float)
_error_count: dict[str, int] = defaultdict(int)


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        elapsed = time.monotonic() - start

        path = request.url.path
        method = request.method
        key = f"{method} {path}"
        _request_count[key] += 1
        _request_latency_sum[key] += elapsed

        if response.status_code >= 400:
            _error_count[f"{response.status_code}"] += 1

        return response


@router.get("/metrics")
def prometheus_metrics():
    """Prometheus-compatible text metrics."""
    lines = [
        "# HELP klg_http_requests_total Total HTTP requests",
        "# TYPE klg_http_requests_total counter",
    ]
    for key, count in sorted(_request_count.items()):
        method, path = key.split(" ", 1)
        lines.append(f'klg_http_requests_total{{method="{method}",path="{path}"}} {count}')

    lines += [
        "# HELP klg_http_request_duration_seconds Total request duration",
        "# TYPE klg_http_request_duration_seconds counter",
    ]
    for key, total in sorted(_request_latency_sum.items()):
        method, path = key.split(" ", 1)
        lines.append(f'klg_http_request_duration_seconds{{method="{method}",path="{path}"}} {total:.4f}')

    lines += [
        "# HELP klg_http_errors_total Total HTTP errors by status code",
        "# TYPE klg_http_errors_total counter",
    ]
    for code, count in sorted(_error_count.items()):
        lines.append(f'klg_http_errors_total{{status="{code}"}} {count}')

    return Response(content="\n".join(lines) + "\n", media_type="text/plain")
