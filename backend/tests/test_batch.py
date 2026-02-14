"""
Tests for batch operations and email service.
"""
import pytest


class TestBatchDelete:
    def test_batch_delete_aircraft(self, client, auth_headers):
        resp = client.post("/api/v1/batch/delete", headers=auth_headers,
                          json={"entity_type": "aircraft", "ids": ["fake-id-1", "fake-id-2"]})
        assert resp.status_code == 200
        data = resp.json()
        assert "deleted" in data

    def test_batch_delete_unknown_entity(self, client, auth_headers):
        resp = client.post("/api/v1/batch/delete", headers=auth_headers,
                          json={"entity_type": "unknown", "ids": ["id1"]})
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data


class TestBatchStatusUpdate:
    def test_batch_status_update(self, client, auth_headers):
        resp = client.post("/api/v1/batch/status", headers=auth_headers,
                          json={"entity_type": "aircraft", "ids": ["fake-id"], "status": "active"})
        assert resp.status_code == 200
        data = resp.json()
        assert "updated" in data


class TestEmailService:
    def test_email_stub_send(self):
        from app.services.email_service import EmailService, EmailMessage
        svc = EmailService()  # No SMTP = stub mode
        result = svc.send(EmailMessage(to="test@test.com", subject="Test", body="Hello"))
        assert result is True

    def test_risk_alert_email(self):
        from app.services.email_service import email_service
        result = email_service.send_risk_alert("admin@klg.ru", "Просроченный ресурс", "critical", "RA-12345")
        assert result is True

    def test_application_status_email(self):
        from app.services.email_service import email_service
        result = email_service.send_application_status("user@klg.ru", "APP-001", "approved")
        assert result is True


class TestStatsEndpoint:
    def test_get_stats(self, client, auth_headers):
        resp = client.get("/api/v1/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)


class TestLegalEndpoints:
    def test_list_fap(self, client, auth_headers):
        resp = client.get("/api/v1/legal/fap", headers=auth_headers)
        assert resp.status_code in [200, 404]

    def test_list_icao(self, client, auth_headers):
        resp = client.get("/api/v1/legal/icao", headers=auth_headers)
        assert resp.status_code in [200, 404]


class TestBackup:
    def test_backup_export(self, client, auth_headers):
        resp = client.get("/api/v1/backup/export", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "version" in data
        assert "total_records" in data

    def test_backup_stats(self, client, auth_headers):
        resp = client.get("/api/v1/backup/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "tables" in data
        assert "total" in data

    def test_openapi_export(self, client):
        resp = client.get("/api/v1/health/openapi.json")
        assert resp.status_code in [200, 404]


class TestEnhancedHealth:
    def test_health_with_deps(self, client):
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "database" in data
        assert "version" in data

    def test_health_has_environment(self, client):
        resp = client.get("/api/v1/health")
        data = resp.json()
        assert data.get("environment") in ["development", "production"]


class TestRestore:
    def test_restore_invalid_file(self, client, auth_headers):
        from io import BytesIO
        resp = client.post(
            "/api/v1/backup/restore",
            headers=auth_headers,
            files={"file": ("backup.json", BytesIO(b"not json"), "application/json")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data

    def test_restore_valid_empty_backup(self, client, auth_headers):
        import json
        from io import BytesIO
        backup = json.dumps({"version": "2.2.0", "data": {}, "created_at": "2025-01-01"})
        resp = client.post(
            "/api/v1/backup/restore",
            headers=auth_headers,
            files={"file": ("backup.json", BytesIO(backup.encode()), "application/json")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "restored" in data
