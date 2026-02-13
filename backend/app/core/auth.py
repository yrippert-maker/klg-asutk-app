"""Re-export get_current_user for routes that import from app.core.auth"""
from app.api.deps import get_current_user

__all__ = ["get_current_user"]
