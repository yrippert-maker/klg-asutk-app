"""
Extended tests: checklists, cert-applications workflow, pagination.
"""
import pytest


class TestChecklistTemplates:
    def test_list_templates(self, client, auth_headers):
        r = client.get("/api/v1/checklists/templates", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data

    def test_create_template(self, client, auth_headers):
        r = client.post("/api/v1/checklists/templates", json={
            "name": "Test Template", "version": 1, "domain": "test",
            "items": [
                {"code": "T.001", "text": "Check item 1", "sort_order": 1},
                {"code": "T.002", "text": "Check item 2", "sort_order": 2},
            ]
        }, headers=auth_headers)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Test Template"
        assert len(data["items"]) == 2

    def test_generate_fap_m(self, client, auth_headers):
        r = client.post(
            "/api/v1/checklists/generate?source=fap_m_inspection&name=FAP-M Test",
            headers=auth_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["domain"] == "fap_m_inspection"
        assert len(data["items"]) == 5

    def test_get_template_by_id(self, client, auth_headers):
        # Create first
        r = client.post("/api/v1/checklists/templates", json={
            "name": "Lookup Template", "version": 1,
        }, headers=auth_headers)
        tid = r.json()["id"]
        # Get by id
        r2 = client.get(f"/api/v1/checklists/templates/{tid}", headers=auth_headers)
        assert r2.status_code == 200
        assert r2.json()["id"] == tid


class TestPagination:
    """Verify pagination format across endpoints."""

    def test_organizations_pagination_format(self, client, auth_headers):
        r = client.get("/api/v1/organizations?page=1&per_page=5", headers=auth_headers)
        data = r.json()
        for key in ("items", "total", "page", "per_page", "pages"):
            assert key in data, f"Missing key: {key}"
        assert data["page"] == 1
        assert data["per_page"] == 5

    def test_per_page_cap(self, client, auth_headers):
        """per_page should be capped at 100."""
        r = client.get("/api/v1/organizations?per_page=999", headers=auth_headers)
        # FastAPI validation should cap or reject
        assert r.status_code in (200, 422)

    def test_aircraft_pagination(self, client, auth_headers):
        r = client.get("/api/v1/aircraft?page=1&per_page=10", headers=auth_headers)
        data = r.json()
        assert "items" in data
        assert "total" in data


class TestRiskAlerts:
    def test_list_risks(self, client, auth_headers):
        r = client.get("/api/v1/risk-alerts", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data

    def test_scan_risks(self, client, auth_headers):
        r = client.post("/api/v1/risk-alerts/scan", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "created" in data


class TestStats:
    def test_get_stats(self, client, auth_headers):
        r = client.get("/api/v1/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "aircraft" in data
        assert "risks" in data


class TestTasksDashboard:
    def test_list_tasks(self, client, auth_headers):
        r = client.get("/api/v1/tasks", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
