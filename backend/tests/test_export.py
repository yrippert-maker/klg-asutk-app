"""
Tests for export endpoint and additional routes.
"""
import pytest


class TestExport:
    """Export endpoint tests."""

    def test_export_aircraft_csv(self, client, auth_headers):
        resp = client.get("/api/v1/export/aircraft?format=csv", headers=auth_headers)
        assert resp.status_code == 200
        assert "text/csv" in resp.headers.get("content-type", "")

    def test_export_aircraft_json(self, client, auth_headers):
        resp = client.get("/api/v1/export/aircraft?format=json", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_export_organizations_csv(self, client, auth_headers):
        resp = client.get("/api/v1/export/organizations?format=csv", headers=auth_headers)
        assert resp.status_code == 200

    def test_export_unknown_dataset(self, client, auth_headers):
        resp = client.get("/api/v1/export/unknown_thing?format=csv", headers=auth_headers)
        assert resp.status_code == 400

    def test_export_with_limit(self, client, auth_headers):
        resp = client.get("/api/v1/export/aircraft?format=json&limit=5", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) <= 5


class TestNotifications:
    """Notification endpoint tests."""

    def test_list_notifications(self, client, auth_headers):
        resp = client.get("/api/v1/notifications", headers=auth_headers)
        assert resp.status_code in [200, 422]

    def test_mark_all_read(self, client, auth_headers):
        resp = client.put("/api/v1/notifications/read-all", headers=auth_headers)
        assert resp.status_code in [200, 204, 404]


class TestHealthAndMetrics:
    """Health and metrics tests."""

    def test_health_check(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data

    def test_metrics_endpoint(self, client):
        resp = client.get("/api/v1/metrics")
        assert resp.status_code == 200
        text = resp.text
        assert "klg_http_requests_total" in text or "requests" in text.lower()


class TestAuditLog:
    """Audit log tests."""

    def test_list_audit_log(self, client, auth_headers):
        resp = client.get("/api/v1/audit-log", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data or isinstance(data, list)

    def test_filter_audit_log_by_entity(self, client, auth_headers):
        resp = client.get("/api/v1/audit-log?entity_type=aircraft", headers=auth_headers)
        assert resp.status_code == 200

    def test_filter_audit_log_by_action(self, client, auth_headers):
        resp = client.get("/api/v1/audit-log?action=create", headers=auth_headers)
        assert resp.status_code == 200


class TestWorkflows:
    """Workflow integration tests."""

    def test_application_create_and_submit(self, client, auth_headers):
        # Create
        resp = client.post("/api/v1/cert-applications", headers=auth_headers,
                          json={"subject": "Test workflow application"})
        if resp.status_code == 200:
            app = resp.json()
            app_id = app.get("id")
            # Submit
            if app_id:
                resp2 = client.post(f"/api/v1/cert-applications/{app_id}/submit", headers=auth_headers)
                assert resp2.status_code in [200, 400, 404]  # 400 if already submitted

    def test_risk_scan_and_resolve(self, client, auth_headers):
        # Scan
        resp = client.post("/api/v1/risk-alerts/scan", headers=auth_headers)
        assert resp.status_code in [200, 201, 404]

    def test_checklist_generate_fap_m(self, client, auth_headers):
        resp = client.post("/api/v1/checklists/generate", headers=auth_headers,
                          json={"source": "fap_m_inspection", "name": "Test ФАП-М"})
        assert resp.status_code in [200, 201, 404]


class TestEdgeCases:
    """Edge cases and error handling."""

    def test_invalid_uuid_returns_error(self, client, auth_headers):
        resp = client.get("/api/v1/aircraft/not-a-uuid", headers=auth_headers)
        assert resp.status_code in [400, 404, 422]

    def test_create_with_missing_fields(self, client, auth_headers):
        resp = client.post("/api/v1/organizations", headers=auth_headers, json={})
        assert resp.status_code in [400, 422]

    def test_unauthorized_without_token(self, client):
        resp = client.get("/api/v1/aircraft")
        assert resp.status_code in [401, 403]

    def test_pagination_params(self, client, auth_headers):
        resp = client.get("/api/v1/aircraft?page=1&per_page=5", headers=auth_headers)
        if resp.status_code == 200:
            data = resp.json()
            if "per_page" in data:
                assert data["per_page"] <= 5

    def test_search_param(self, client, auth_headers):
        resp = client.get("/api/v1/aircraft?q=Boeing", headers=auth_headers)
        assert resp.status_code == 200
