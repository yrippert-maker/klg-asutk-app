"""
Tests for authentication and security module.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import os


class TestDevTokenDisabled:
    """SEC-002: Dev token must be disabled by default."""

    def test_dev_auth_disabled_by_default(self):
        """ENABLE_DEV_AUTH defaults to false."""
        with patch.dict(os.environ, {}, clear=True):
            # Re-import to pick up env
            import importlib
            import app.api.deps as deps_mod
            importlib.reload(deps_mod)
            assert deps_mod.ENABLE_DEV_AUTH is False

    def test_is_dev_token_returns_false_when_disabled(self):
        """_is_dev_token should return False when ENABLE_DEV_AUTH is off."""
        with patch.dict(os.environ, {"ENABLE_DEV_AUTH": "false"}):
            import importlib
            import app.api.deps as deps_mod
            importlib.reload(deps_mod)
            assert deps_mod._is_dev_token("dev") is False

    def test_is_dev_token_returns_true_when_enabled(self):
        """_is_dev_token should return True when ENABLE_DEV_AUTH=true."""
        with patch.dict(os.environ, {"ENABLE_DEV_AUTH": "true"}):
            import importlib
            import app.api.deps as deps_mod
            importlib.reload(deps_mod)
            assert deps_mod._is_dev_token("dev") is True


class TestRequireRoles:
    """Test RBAC role checking."""

    def test_require_roles_creates_dependency(self):
        from app.api.deps import require_roles
        dep = require_roles("admin", "operator_user")
        assert callable(dep)


class TestRisingWaveValidation:
    """SEC-003: SQL injection prevention in RisingWave."""

    def test_valid_view_name_passes(self):
        from app.streaming.risingwave import _validate_view_name
        result = _validate_view_name("mv_aircraft_status")
        assert result == "mv_aircraft_status"

    def test_invalid_view_name_raises(self):
        from app.streaming.risingwave import _validate_view_name
        with pytest.raises(ValueError, match="not in the allowed list"):
            _validate_view_name("DROP TABLE users;--")

    def test_view_name_not_in_whitelist_raises(self):
        from app.streaming.risingwave import _validate_view_name
        with pytest.raises(ValueError):
            _validate_view_name("some_random_view")


class TestTokenUser:
    """Test token_to_user mapping."""

    def test_token_to_user_basic(self):
        from app.services.security import token_to_user
        claims = {
            "sub": "user123",
            "name": "Test User",
            "email": "test@example.com",
            "role": "admin",
            "org_id": "org1",
        }
        user = token_to_user(claims)
        assert user.sub == "user123"
        assert user.display_name == "Test User"
        assert user.email == "test@example.com"
        assert user.role == "admin"
        assert user.org_id == "org1"

    def test_token_to_user_defaults(self):
        from app.services.security import token_to_user
        claims = {"sub": "user456"}
        user = token_to_user(claims)
        assert user.sub == "user456"
        assert user.role == "operator_user"
        assert user.email is None
