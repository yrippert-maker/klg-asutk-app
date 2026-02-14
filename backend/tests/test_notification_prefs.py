"""Tests for Notification Preferences."""
import pytest
from tests.conftest import *


class TestNotificationPrefs:
    def test_get_default_prefs(self, client, auth_headers):
        resp = client.get("/api/v1/notification-preferences/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ad_mandatory"] is True
        assert data["defect_minor"] is False

    def test_update_prefs(self, client, auth_headers):
        resp = client.put("/api/v1/notification-preferences/", headers=auth_headers, json={
            "ad_mandatory": True, "ad_recommended": True,
            "defect_critical": True, "defect_major": False, "defect_minor": False,
            "wo_aog": True, "wo_closed": False,
            "life_limit_critical": True, "personnel_expiry": True,
            "channels_email": True, "channels_push": True, "channels_ws": False,
        })
        assert resp.status_code == 200
        assert resp.json()["channels_push"] is True
        assert resp.json()["wo_closed"] is False
