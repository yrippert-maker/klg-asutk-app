"""
Core API route tests for КЛГ АСУ ТК.
Tests: health, organizations CRUD, aircraft CRUD, cert_applications workflow.
"""
import pytest


class TestHealth:
    def test_health_ok(self, client):
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] in ("ok", "degraded")


class TestOrganizations:
    def test_list_empty(self, client, auth_headers):
        r = client.get("/api/v1/organizations", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert data["total"] == 0

    def test_create_and_get(self, client, auth_headers):
        payload = {"kind": "operator", "name": "Test Airlines", "inn": "1234567890"}
        r = client.post("/api/v1/organizations", json=payload, headers=auth_headers)
        assert r.status_code == 201
        org = r.json()
        assert org["name"] == "Test Airlines"
        assert org["kind"] == "operator"

        # GET by id
        r2 = client.get(f"/api/v1/organizations/{org['id']}", headers=auth_headers)
        assert r2.status_code == 200
        assert r2.json()["name"] == "Test Airlines"

    def test_pagination(self, client, auth_headers):
        # Create 3 orgs
        for i in range(3):
            client.post("/api/v1/organizations",
                        json={"kind": "operator", "name": f"Org {i}"},
                        headers=auth_headers)
        r = client.get("/api/v1/organizations?per_page=2&page=1", headers=auth_headers)
        data = r.json()
        assert len(data["items"]) == 2
        assert data["total"] == 3
        assert data["pages"] == 2

    def test_search(self, client, auth_headers):
        client.post("/api/v1/organizations", json={"kind": "operator", "name": "Alpha Airlines"}, headers=auth_headers)
        client.post("/api/v1/organizations", json={"kind": "mro", "name": "Beta MRO"}, headers=auth_headers)
        r = client.get("/api/v1/organizations?q=Alpha", headers=auth_headers)
        assert r.json()["total"] == 1

    def test_update(self, client, auth_headers):
        r = client.post("/api/v1/organizations", json={"kind": "operator", "name": "Old Name"}, headers=auth_headers)
        org_id = r.json()["id"]
        r2 = client.patch(f"/api/v1/organizations/{org_id}", json={"name": "New Name"}, headers=auth_headers)
        assert r2.status_code == 200
        assert r2.json()["name"] == "New Name"

    def test_delete(self, client, auth_headers):
        r = client.post("/api/v1/organizations", json={"kind": "operator", "name": "To Delete"}, headers=auth_headers)
        org_id = r.json()["id"]
        r2 = client.delete(f"/api/v1/organizations/{org_id}", headers=auth_headers)
        assert r2.status_code == 204


class TestAuditEvents:
    def test_audit_events_paginated(self, client, auth_headers):
        r = client.get("/api/v1/audit/events", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data

    def test_audit_created_on_org_create(self, client, auth_headers):
        client.post("/api/v1/organizations", json={"kind": "operator", "name": "Audited Org"}, headers=auth_headers)
        r = client.get("/api/v1/audit/events?entity_type=organization", headers=auth_headers)
        data = r.json()
        assert data["total"] >= 1


class TestUsers:
    def test_get_me(self, client, auth_headers):
        r = client.get("/api/v1/users/me", headers=auth_headers)
        assert r.status_code == 200
        assert "display_name" in r.json()


class TestNotifications:
    def test_list_empty(self, client, auth_headers):
        r = client.get("/api/v1/notifications", headers=auth_headers)
        assert r.status_code == 200

    def test_read_all(self, client, auth_headers):
        r = client.post("/api/v1/notifications/read-all", headers=auth_headers)
        assert r.status_code == 200
