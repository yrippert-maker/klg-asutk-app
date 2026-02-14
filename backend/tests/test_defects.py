"""Tests for Defects."""
import pytest
from tests.conftest import *

class TestDefects:
    def test_create_defect(self, client, auth_headers):
        resp = client.post("/api/v1/defects/", headers=auth_headers, json={
            "aircraft_reg": "RA-89001",
            "ata_chapter": "32",
            "description": "NLG steering shimmy during taxi",
            "severity": "major",
            "discovered_during": "preflight",
        })
        assert resp.status_code == 200
        assert resp.json()["severity"] == "major"

    def test_rectify_defect(self, client, auth_headers):
        d = client.post("/api/v1/defects/", headers=auth_headers, json={
            "aircraft_reg": "RA-TEST", "description": "Test", "severity": "minor",
        }).json()
        resp = client.put(f"/api/v1/defects/{d['id']}/rectify",
                          headers=auth_headers, params={"action": "Replaced O-ring"})
        assert resp.json()["status"] == "rectified"

    def test_defer_defect_mel(self, client, auth_headers):
        d = client.post("/api/v1/defects/", headers=auth_headers, json={
            "aircraft_reg": "RA-TEST2", "description": "Minor IFE fault", "severity": "minor",
        }).json()
        resp = client.put(f"/api/v1/defects/{d['id']}/defer",
                          headers=auth_headers, params={"mel_ref": "MEL 25-11-01", "until": "2026-03-15"})
        assert resp.json()["status"] == "deferred"
        assert resp.json()["mel_reference"] == "MEL 25-11-01"
