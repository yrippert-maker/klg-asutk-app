"""Tests for Airworthiness Core — AD, SB, Life Limits, MP, Components."""
import pytest
from tests.conftest import *


class TestDirectives:
    def test_list_empty(self, client, auth_headers):
        resp = client.get("/api/v1/airworthiness-core/directives", headers=auth_headers)
        assert resp.status_code == 200
        assert "legal_basis" in resp.json()

    def test_create_directive(self, client, auth_headers):
        resp = client.post("/api/v1/airworthiness-core/directives", headers=auth_headers, json={
            "number": "AD 2026-02-01R1",
            "title": "Inspection of wing spar fitting",
            "issuing_authority": "FATA",
            "aircraft_types": ["SSJ-100"],
            "ata_chapter": "57",
            "effective_date": "2026-03-01",
            "compliance_type": "mandatory",
            "description": "Mandatory inspection per ФАП-148 п.4.3",
        })
        assert resp.status_code == 200
        assert resp.json()["number"] == "AD 2026-02-01R1"

    def test_comply_directive(self, client, auth_headers):
        d = client.post("/api/v1/airworthiness-core/directives", headers=auth_headers, json={
            "number": "AD-TEST-COMPLY",
            "title": "Test directive",
            "effective_date": "2026-01-01",
        }).json()
        resp = client.put(f"/api/v1/airworthiness-core/directives/{d['id']}/comply",
                          headers=auth_headers, params={"notes": "Complied per WO-123"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "complied"


class TestBulletins:
    def test_create_bulletin(self, client, auth_headers):
        resp = client.post("/api/v1/airworthiness-core/bulletins", headers=auth_headers, json={
            "number": "SB-737-32-1456",
            "title": "MLG trunnion inspection",
            "manufacturer": "Boeing",
            "aircraft_types": ["Boeing 737"],
            "category": "mandatory",
            "issued_date": "2026-01-15",
            "estimated_manhours": 24.5,
        })
        assert resp.status_code == 200
        assert resp.json()["category"] == "mandatory"


class TestLifeLimits:
    def test_create_life_limit(self, client, auth_headers):
        resp = client.post("/api/v1/airworthiness-core/life-limits", headers=auth_headers, json={
            "component_name": "Engine Fan Disk",
            "part_number": "1234-5678",
            "serial_number": "SN-001",
            "limit_type": "combined",
            "flight_hours_limit": 20000,
            "cycles_limit": 10000,
            "current_hours": 15000,
            "current_cycles": 7500,
        })
        assert resp.status_code == 200

    def test_list_life_limits_with_remaining(self, client, auth_headers):
        client.post("/api/v1/airworthiness-core/life-limits", headers=auth_headers, json={
            "component_name": "Test Component",
            "part_number": "PN-1",
            "serial_number": "SN-REM",
            "limit_type": "flight_hours",
            "flight_hours_limit": 1000,
            "current_hours": 900,
        })
        resp = client.get("/api/v1/airworthiness-core/life-limits", headers=auth_headers)
        items = resp.json()["items"]
        found = [i for i in items if i["serial_number"] == "SN-REM"]
        assert len(found) > 0
        assert "remaining" in found[0]


class TestMaintPrograms:
    def test_create_program(self, client, auth_headers):
        resp = client.post("/api/v1/airworthiness-core/maintenance-programs", headers=auth_headers, json={
            "name": "SSJ-100 Approved Maintenance Program",
            "aircraft_type": "SSJ-100",
            "revision": "Rev.5",
            "approved_by": "ФАВТ",
            "tasks": [
                {"task_id": "A-01", "description": "Daily check", "interval_days": 1},
                {"task_id": "A-48", "description": "48h check", "interval_hours": 48},
                {"task_id": "C-01", "description": "C-check", "interval_months": 18},
            ],
        })
        assert resp.status_code == 200
        assert len(resp.json()["tasks"]) == 3


class TestComponents:
    def test_create_component(self, client, auth_headers):
        resp = client.post("/api/v1/airworthiness-core/components", headers=auth_headers, json={
            "name": "Nose Landing Gear Assembly",
            "part_number": "NLG-1234",
            "serial_number": "NLG-SN-001",
            "ata_chapter": "32",
            "manufacturer": "Liebherr",
            "condition": "serviceable",
            "certificate_type": "EASA Form 1",
        })
        assert resp.status_code == 200
        assert resp.json()["condition"] == "serviceable"

    def test_transfer_component(self, client, auth_headers):
        c = client.post("/api/v1/airworthiness-core/components", headers=auth_headers, json={
            "name": "APU", "part_number": "APU-1", "serial_number": "APU-SN-1",
            "condition": "overhauled",
        }).json()
        resp = client.put(f"/api/v1/airworthiness-core/components/{c['id']}/transfer",
                          headers=auth_headers, params={"new_aircraft_id": "ac-123", "position": "Tail Section"})
        assert resp.status_code == 200
        assert resp.json()["install_position"] == "Tail Section"


class TestAircraftStatus:
    def test_status_report(self, client, auth_headers):
        resp = client.get("/api/v1/airworthiness-core/aircraft-status/RA-12345", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert "airworthy" in data
        assert "legal_basis" in data
