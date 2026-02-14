"""Tests for Work Orders — наряды на ТО."""
import pytest
from tests.conftest import *

class TestWorkOrders:
    def test_create_wo(self, client, auth_headers):
        resp = client.post("/api/v1/work-orders/", headers=auth_headers, json={
            "wo_number": "WO-TEST-001",
            "aircraft_reg": "RA-89001",
            "wo_type": "scheduled",
            "title": "A-check",
            "estimated_manhours": 48,
            "priority": "normal",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "draft"

    def test_wo_lifecycle(self, client, auth_headers):
        # Create
        wo = client.post("/api/v1/work-orders/", headers=auth_headers, json={
            "wo_number": "WO-LIFECYCLE",
            "aircraft_reg": "RA-89002",
            "wo_type": "ad_compliance",
            "title": "AD compliance check",
            "estimated_manhours": 8,
        }).json()
        assert wo["status"] == "draft"
        # Open
        resp = client.put(f"/api/v1/work-orders/{wo['id']}/open", headers=auth_headers)
        assert resp.json()["status"] == "in_progress"
        # Close with CRS
        resp = client.put(f"/api/v1/work-orders/{wo['id']}/close", headers=auth_headers, json={
            "actual_manhours": 7.5,
            "findings": "No defects found",
            "crs_signed_by": "Иванов И.И.",
        })
        assert resp.json()["status"] == "closed"
        assert resp.json()["crs_signed_by"] == "Иванов И.И."

    def test_wo_stats(self, client, auth_headers):
        resp = client.get("/api/v1/work-orders/stats/summary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "aog" in data

    def test_wo_filters(self, client, auth_headers):
        resp = client.get("/api/v1/work-orders/?status=in_progress", headers=auth_headers)
        assert resp.status_code == 200

    def test_cancel_wo(self, client, auth_headers):
        wo = client.post("/api/v1/work-orders/", headers=auth_headers, json={
            "wo_number": "WO-CANCEL",
            "aircraft_reg": "RA-89003",
            "wo_type": "unscheduled",
            "title": "Test cancel",
        }).json()
        resp = client.put(f"/api/v1/work-orders/{wo['id']}/cancel",
                          headers=auth_headers, params={"reason": "Parts unavailable"})
        assert resp.json()["status"] == "cancelled"
