"""Tests for Global Search."""
import pytest
from tests.conftest import *


class TestGlobalSearch:
    def test_search_empty(self, client, auth_headers):
        resp = client.get("/api/v1/search/global?q=xxxxxxxxx", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_search_too_short(self, client, auth_headers):
        resp = client.get("/api/v1/search/global?q=a", headers=auth_headers)
        assert resp.status_code == 422

    def test_search_finds_directive(self, client, auth_headers):
        # Create a directive first
        client.post("/api/v1/airworthiness-core/directives", headers=auth_headers, json={
            "number": "AD-SEARCH-TEST-001", "title": "Test searchable directive",
            "effective_date": "2026-01-01",
        })
        resp = client.get("/api/v1/search/global?q=SEARCH-TEST", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1
        assert any(r["type"] == "directive" for r in resp.json()["results"])

    def test_search_finds_specialist(self, client, auth_headers):
        client.post("/api/v1/personnel-plg/specialists", headers=auth_headers, json={
            "full_name": "Иванов Поиск Тестович", "personnel_number": "SRCH-001",
            "position": "Инженер", "category": "B1",
        })
        resp = client.get("/api/v1/search/global?q=Поиск", headers=auth_headers)
        assert resp.json()["total"] >= 1
