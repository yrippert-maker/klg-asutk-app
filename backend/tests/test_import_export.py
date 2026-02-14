"""Tests for Import/Export XLSX."""
import pytest
from tests.conftest import *


class TestExport:
    @pytest.mark.parametrize("entity", ["components", "directives", "bulletins", "specialists", "defects", "work_orders"])
    def test_export_xlsx(self, client, auth_headers, entity):
        resp = client.get(f"/api/v1/import-export/export/{entity}", headers=auth_headers)
        assert resp.status_code == 200
        assert "spreadsheetml" in resp.headers.get("content-type", "")

    def test_export_unknown_entity(self, client, auth_headers):
        resp = client.get("/api/v1/import-export/export/unknown", headers=auth_headers)
        assert resp.status_code == 400


class TestImport:
    def test_import_bad_file_ext(self, client, auth_headers):
        from io import BytesIO
        resp = client.post("/api/v1/import-export/import/components", headers=auth_headers,
                           files={"file": ("test.txt", BytesIO(b"data"), "text/plain")})
        assert resp.status_code == 400
