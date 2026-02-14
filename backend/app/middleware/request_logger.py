"""Request logging middleware."""
import logging, time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("klg.requests")

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        if request.url.path in ("/api/v1/health", "/api/v1/metrics"):
            return await call_next(request)
        response = await call_next(request)
        ms = (time.time() - start) * 1000
        logger.info("%s %s %d %.1fms", request.method, request.url.path, response.status_code, ms)
        # Audit log regulator access
        if "/regulator" in str(request.url.path):
            logger.info("REGULATOR_ACCESS: %s %s from user=%s",
                request.method, request.url.path, getattr(request.state, "user_id", "-"))
        response.headers["X-Response-Time"] = f"{ms:.1f}ms"
        return response
