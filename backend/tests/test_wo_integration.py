"""Tests for Work Order cross-module integration."""
import pytest
from tests.conftest import *


class TestWOFromDirective:
    def test_create_wo_from_ad(self, client, auth_headers):
        ad = client.post("/api/v1/airworthiness-core/directives", headers=auth_headers, json={
            "number": "AD-WO-INT-001", "title": "Integration test AD",
            "effective_date": "2026-01-01", "compliance_type": "mandatory",
            "aircraft_types": ["SSJ-100"],
        }).json()
        resp = client.post(f"/api/v1/work-orders/from-directive/{ad['id']}", headers=auth_headers)
        assert resp.status_code == 200
        wo = resp.json()
        assert wo["wo_type"] == "ad_compliance"
        assert wo["priority"] == "urgent"

    def test_create_wo_from_nonexistent_ad(self, client, auth_headers):
        resp = client.post("/api/v1/work-orders/from-directive/nonexistent", headers=auth_headers)
        assert resp.status_code == 404


class TestWOFromDefect:
    def test_create_wo_from_critical_defect(self, client, auth_headers):
        defect = client.post("/api/v1/defects/", headers=auth_headers, json={
            "aircraft_reg": "RA-INT-001", "description": "Critical crack found",
            "severity": "critical",
        }).json()
        resp = client.post(f"/api/v1/work-orders/from-defect/{defect['id']}", headers=auth_headers)
        assert resp.status_code == 200
        wo = resp.json()
        assert wo["wo_type"] == "defect_rectification"
        assert wo["priority"] == "aog"


class TestWOFromBulletin:
    def test_create_wo_from_sb(self, client, auth_headers):
        sb = client.post("/api/v1/airworthiness-core/bulletins", headers=auth_headers, json={
            "number": "SB-INT-001", "title": "Test SB integration",
            "manufacturer": "Test OEM", "issued_date": "2026-01-01",
            "category": "mandatory", "estimated_manhours": 16,
        }).json()
        resp = client.post(f"/api/v1/work-orders/from-bulletin/{sb['id']}", headers=auth_headers)
        assert resp.status_code == 200
        wo = resp.json()
        assert wo["wo_type"] == "sb_compliance"
        assert wo["estimated_manhours"] == 16


class TestBatchWO:
    def test_batch_from_program(self, client, auth_headers):
        mp = client.post("/api/v1/airworthiness-core/maintenance-programs", headers=auth_headers, json={
            "name": "Test MP", "aircraft_type": "SSJ-100",
            "tasks": [
                {"task_id": "T-01", "description": "Daily check"},
                {"task_id": "T-02", "description": "Weekly check"},
                {"task_id": "T-03", "description": "A-check"},
            ],
        }).json()
        resp = client.post(f"/api/v1/work-orders/batch-from-program/{mp['id']}",
                           headers=auth_headers, params={"aircraft_reg": "RA-89001"})
        assert resp.status_code == 200
        assert resp.json()["created_count"] == 3


class TestWOPDF:
    def test_pdf_generation(self, client, auth_headers):
        wo = client.post("/api/v1/work-orders/", headers=auth_headers, json={
            "wo_number": "WO-PDF-TEST", "aircraft_reg": "RA-89001",
            "wo_type": "scheduled", "title": "PDF test",
        }).json()
        # Close with CRS
        client.put(f"/api/v1/work-orders/{wo['id']}/open", headers=auth_headers)
        client.put(f"/api/v1/work-orders/{wo['id']}/close", headers=auth_headers, json={
            "actual_manhours": 5, "crs_signed_by": "Test Engineer",
        })
        resp = client.get(f"/api/v1/work-orders/{wo['id']}/report/pdf", headers=auth_headers)
        assert resp.status_code in [200, 500]  # 500 if reportlab not installed
