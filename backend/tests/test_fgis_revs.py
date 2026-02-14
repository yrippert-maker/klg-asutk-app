"""Tests for ФГИС РЭВС integration."""
import pytest
from tests.conftest import *


class TestFGISPull:
    def test_aircraft_registry(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/aircraft-registry", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "ФГИС РЭВС"
        assert data["total"] >= 1
        assert data["items"][0]["registration"].startswith("RA-")

    def test_aircraft_by_registration(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/aircraft-registry?registration=RA-89001", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()["items"]) == 1

    def test_certificates(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/certificates", headers=auth_headers)
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert any(c["status"] == "valid" for c in items)

    def test_operators(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/operators", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["items"][0]["certificate_number"].startswith("ЭВ-")

    def test_directives(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/directives", headers=auth_headers)
        assert resp.status_code == 200
        assert all(d["issuing_authority"] == "ФАВТ" for d in resp.json()["items"])

    def test_maint_organizations(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/maintenance-organizations", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["items"][0]["approval_scope"]


class TestFGISPush:
    def test_push_compliance_report(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/push/compliance-report", headers=auth_headers, json={
            "directive_number": "АД-2026-0012",
            "aircraft_registration": "RA-89001",
            "compliance_date": "2026-02-13",
            "work_order_number": "WO-AD-001",
            "crs_signed_by": "Иванов И.И.",
        })
        assert resp.status_code == 200
        assert resp.json()["action"] == "push_compliance"

    def test_push_maintenance_report(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/push/maintenance-report", headers=auth_headers, json={
            "work_order_number": "WO-TEST-001",
            "aircraft_registration": "RA-89001",
            "work_type": "scheduled",
            "completion_date": "2026-02-13",
            "crs_signed_by": "Петров П.П.",
            "actual_manhours": 48,
        })
        assert resp.status_code == 200

    def test_push_defect_report(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/push/defect-report", headers=auth_headers, json={
            "aircraft_registration": "RA-89001",
            "defect_description": "Crack found on wing spar",
            "severity": "critical",
            "ata_chapter": "57",
        })
        assert resp.status_code == 200
        assert resp.json()["legal_basis"] == "ФАП-128"


class TestFGISSync:
    def test_sync_aircraft(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/sync/aircraft", headers=auth_headers)
        assert resp.status_code == 200
        result = resp.json()["result"]
        assert result["entity_type"] == "aircraft"
        assert result["status"] in ("success", "partial")

    def test_sync_certificates(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/sync/certificates", headers=auth_headers)
        assert resp.status_code == 200

    def test_sync_directives(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/sync/directives", headers=auth_headers)
        assert resp.status_code == 200

    def test_sync_all(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/sync/all", headers=auth_headers)
        assert resp.status_code == 200
        results = resp.json()["results"]
        assert "aircraft" in results
        assert "certificates" in results
        assert "directives" in results

    def test_sync_status(self, client, auth_headers):
        # Run a sync first
        client.post("/api/v1/fgis-revs/sync/aircraft", headers=auth_headers)
        resp = client.get("/api/v1/fgis-revs/sync/status", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total_syncs"] >= 1


class TestFGISConnection:
    def test_connection_status(self, client, auth_headers):
        resp = client.get("/api/v1/fgis-revs/connection-status", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "fgis_revs" in data
        assert "smev_30" in data
        assert data["fgis_revs"]["status"] == "mock_mode"


class TestSMEV:
    def test_smev_send(self, client, auth_headers):
        resp = client.post("/api/v1/fgis-revs/smev/send", headers=auth_headers, json={
            "service_code": "FAVT-001",
            "data": {"registration": "RA-89001"},
        })
        assert resp.status_code == 200
        assert resp.json()["service_code"] == "FAVT-001"
        assert resp.json()["message_id"]
