"""
Tests for ФАВТ Regulator Panel endpoints.
Verifies access control, data format, and legal basis fields.
"""
import pytest
from tests.conftest import *


class TestRegulatorAccess:
    """Regulator endpoints require favt_inspector or admin role."""

    def test_overview_requires_auth(self, client):
        resp = client.get("/api/v1/regulator/overview")
        assert resp.status_code in [401, 403]

    def test_overview_with_admin(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/overview", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "aircraft" in data
        assert "certification" in data
        assert "safety" in data
        assert "legal_basis" in data

    def test_overview_has_legal_basis(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/overview", headers=auth_headers)
        data = resp.json()
        basis = data.get("legal_basis", [])
        assert any("ВК РФ" in b for b in basis)
        assert any("ICAO" in b for b in basis)

    def test_aircraft_register(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/aircraft-register", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "items" in data
        assert "legal_basis" in data

    def test_aircraft_register_no_sensitive_data(self, client, auth_headers):
        """Verify no sensitive data (serial numbers, cost) is exposed."""
        resp = client.get("/api/v1/regulator/aircraft-register", headers=auth_headers)
        data = resp.json()
        for item in data.get("items", []):
            assert "serial_number" not in item
            assert "cost" not in item
            assert "engine_serial" not in item

    def test_certifications(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/certifications", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "legal_basis" in data
        assert "ФАП-246" in data["legal_basis"]

    def test_certifications_no_personal_data(self, client, auth_headers):
        """Verify no personal data of applicants is exposed."""
        resp = client.get("/api/v1/regulator/certifications", headers=auth_headers)
        data = resp.json()
        for item in data.get("items", []):
            assert "applicant_phone" not in item
            assert "applicant_email" not in item
            assert "passport" not in item

    def test_safety_indicators(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/safety-indicators?days=90", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "severity_distribution" in data
        assert "critical_unresolved" in data
        assert "ICAO Annex 19" in data.get("legal_basis", "")

    def test_audits(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/audits?days=90", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "items" in data

    def test_audits_no_inspector_names(self, client, auth_headers):
        """Verify inspector names are not exposed."""
        resp = client.get("/api/v1/regulator/audits", headers=auth_headers)
        data = resp.json()
        for item in data.get("items", []):
            assert "inspector_name" not in item
            assert "inspector_email" not in item

    def test_report_generation(self, client, auth_headers):
        resp = client.get("/api/v1/regulator/report", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["report_type"] == "ФАВТ oversight report"
        assert "overview" in data
        assert "safety" in data
        assert len(data.get("legal_basis", [])) >= 5

    def test_report_has_all_legal_frameworks(self, client, auth_headers):
        """Report must cite all three legal frameworks: RF, ICAO, EASA."""
        resp = client.get("/api/v1/regulator/report", headers=auth_headers)
        data = resp.json()
        basis = " ".join(data.get("legal_basis", []))
        assert "ВК РФ" in basis, "Must cite Russian aviation code"
        assert "ICAO" in basis, "Must cite ICAO standards"
        assert "EASA" in basis, "Must cite EASA regulations"
        assert "ФАП" in basis, "Must cite Federal Aviation Rules"
