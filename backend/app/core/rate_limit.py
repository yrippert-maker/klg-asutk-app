"""
Rate limiting middleware using in-memory storage.
Production: swap to Redis-based limiter.
"""
from __future__ import annotations

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class _TokenBucket:
    """Simple token-bucket rate limiter."""

    def __init__(self, rate: int, per: float = 60.0):
        self.rate = rate
        self.per = per
        self._buckets: dict[str, tuple[float, float]] = {}

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        tokens, last = self._buckets.get(key, (self.rate, now))
        elapsed = now - last
        tokens = min(self.rate, tokens + elapsed * (self.rate / self.per))
        if tokens >= 1:
            self._buckets[key] = (tokens - 1, now)
            return True
        self._buckets[key] = (tokens, now)
        return False


_limiter = _TokenBucket(rate=settings.RATE_LIMIT_PER_MINUTE)

# Paths that skip rate limiting
_SKIP_PATHS = {"/api/v1/health", "/docs", "/redoc", "/openapi.json"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in _SKIP_PATHS:
            return await call_next(request)

        # Key: IP + optional user_id from auth header
        ip = request.client.host if request.client else "unknown"
        key = f"rl:{ip}"

        if not _limiter.allow(key):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={"Retry-After": "60"},
            )

        response = await call_next(request)
        return response
