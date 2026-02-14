"""
Tests for Personnel PLG — сертификация персонала ПЛГ.
Проверяет: программы подготовки, CRUD специалистов, аттестацию, ПК, compliance.
"""
import pytest
from tests.conftest import *


class TestTrainingPrograms:
    """11 программ подготовки с правовыми основаниями."""

    def test_list_programs(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/programs", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 11

    def test_programs_have_legal_basis(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/programs", headers=auth_headers)
        data = resp.json()
        for prog in data["programs"]:
            assert "legal_basis" in prog, f"Program {prog['id']} missing legal_basis"
            assert len(prog["legal_basis"]) > 10

    def test_initial_program_structure(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/programs/PLG-INIT-001", headers=auth_headers)
        assert resp.status_code == 200
        prog = resp.json()
        assert prog["type"] == "initial"
        assert prog["duration_hours"] == 240
        assert len(prog["modules"]) >= 12
        # Verify key modules exist
        codes = [m["code"] for m in prog["modules"]]
        assert "M7" in codes  # Practical maintenance
        assert "M9" in codes  # Human factors
        assert "M10" in codes  # Aviation law
        assert "P1" in codes  # OJT

    def test_recurrent_program_periodicity(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/programs/PLG-REC-001", headers=auth_headers)
        prog = resp.json()
        assert "24 месяца" in prog.get("periodicity", "")
        assert prog["duration_hours"] == 40

    def test_type_rating_program(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/programs/PLG-TYPE-001", headers=auth_headers)
        prog = resp.json()
        assert prog["type"] == "type_rating"
        assert prog["duration_hours"] == 80

    def test_special_courses_exist(self, client, auth_headers):
        special = ["PLG-EWIS-001", "PLG-FUEL-001", "PLG-NDT-001",
                    "PLG-HF-001", "PLG-SMS-001", "PLG-CRS-001"]
        for pid in special:
            resp = client.get(f"/api/v1/personnel-plg/programs/{pid}", headers=auth_headers)
            assert resp.status_code == 200, f"Program {pid} not found"

    def test_program_not_found(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/programs/NONEXISTENT", headers=auth_headers)
        assert resp.status_code == 404

    def test_programs_cover_all_regulatory_frameworks(self, client, auth_headers):
        """All 3 frameworks (RF, ICAO, EASA) must be covered."""
        resp = client.get("/api/v1/personnel-plg/programs", headers=auth_headers)
        all_basis = " ".join(p.get("legal_basis", "") for p in resp.json()["programs"])
        assert "ФАП-147" in all_basis
        assert "EASA" in all_basis or "Part-66" in all_basis
        assert "ICAO" in all_basis


class TestSpecialists:
    """CRUD для специалистов ПЛГ."""

    def test_create_specialist(self, client, auth_headers):
        resp = client.post("/api/v1/personnel-plg/specialists", headers=auth_headers, json={
            "full_name": "Иванов Иван Иванович",
            "personnel_number": "ТН-001",
            "position": "Авиатехник по АиРЭО",
            "category": "B1",
            "specializations": ["SSJ-100", "Ан-148"],
            "license_number": "АС-12345",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Иванов Иван Иванович"
        assert data["category"] == "B1"
        assert "SSJ-100" in data["specializations"]
        return data["id"]

    def test_list_specialists(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/specialists", headers=auth_headers)
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_get_specialist_detail(self, client, auth_headers):
        # Create first
        create_resp = client.post("/api/v1/personnel-plg/specialists", headers=auth_headers, json={
            "full_name": "Петров Пётр Петрович",
            "personnel_number": "ТН-002",
            "position": "Инженер по ПЛГ",
            "category": "C",
        })
        sid = create_resp.json()["id"]
        resp = client.get(f"/api/v1/personnel-plg/specialists/{sid}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["full_name"] == "Петров Пётр Петрович"
        assert "compliance" in data
        assert "attestations" in data
        assert "qualifications" in data


class TestAttestations:
    """Первичная аттестация и переаттестация."""

    def test_record_attestation(self, client, auth_headers):
        # Create specialist
        spec = client.post("/api/v1/personnel-plg/specialists", headers=auth_headers, json={
            "full_name": "Сидоров А.А.",
            "personnel_number": "ТН-003",
            "position": "Авиатехник",
            "category": "B1",
        }).json()

        resp = client.post("/api/v1/personnel-plg/attestations", headers=auth_headers, json={
            "specialist_id": spec["id"],
            "attestation_type": "initial",
            "program_id": "PLG-INIT-001",
            "program_name": "Первичная подготовка специалиста по ПЛГ",
            "training_center": "АУЦ ГА",
            "date_start": "2026-01-10",
            "date_end": "2026-02-10",
            "hours_theory": 200,
            "hours_practice": 40,
            "exam_score": 87.5,
            "result": "passed",
            "certificate_number": "ПА-2026-001",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"] == "passed"
        assert data["exam_score"] == 87.5

    def test_attestation_unknown_specialist(self, client, auth_headers):
        resp = client.post("/api/v1/personnel-plg/attestations", headers=auth_headers, json={
            "specialist_id": "nonexistent",
            "attestation_type": "initial",
            "program_id": "PLG-INIT-001",
            "program_name": "Test",
            "date_start": "2026-01-01",
            "date_end": "2026-01-02",
            "result": "passed",
        })
        assert resp.status_code == 404


class TestQualificationUpgrade:
    """Повышение квалификации."""

    def test_record_qualification(self, client, auth_headers):
        spec = client.post("/api/v1/personnel-plg/specialists", headers=auth_headers, json={
            "full_name": "Козлов Б.В.",
            "personnel_number": "ТН-004",
            "position": "Инженер по ТО",
            "category": "B2",
        }).json()

        resp = client.post("/api/v1/personnel-plg/qualifications", headers=auth_headers, json={
            "specialist_id": spec["id"],
            "program_id": "PLG-REC-001",
            "program_name": "Периодическое ПК",
            "program_type": "recurrent",
            "training_center": "АУЦ ГА",
            "date_start": "2026-02-01",
            "date_end": "2026-02-05",
            "hours_total": 40,
            "result": "passed",
            "next_due": "2028-02-05",
        })
        assert resp.status_code == 200
        assert resp.json()["result"] == "passed"


class TestComplianceReport:
    """Отчёт о соответствии квалификаций."""

    def test_compliance_report_structure(self, client, auth_headers):
        resp = client.get("/api/v1/personnel-plg/compliance-report", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_specialists" in data
        assert "compliant" in data
        assert "non_compliant" in data
        assert "overdue" in data
        assert "expiring_soon" in data
