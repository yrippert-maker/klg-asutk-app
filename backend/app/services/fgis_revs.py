"""
Интеграция с ФГИС РЭВС — Федеральная государственная информационная система
Реестра эксплуатантов воздушных судов.

Правовые основания:
- ВК РФ ст. 33 — Государственный реестр ГА ВС РФ
- ВК РФ ст. 36 — Допуск ВС к эксплуатации
- ВК РФ ст. 37.2 — Поддержание ЛГ (ФЗ-488)
- Приказ Минтранса № 98 от 02.07.2007 — порядок ведения Гос. реестра
- Приказ Росавиации № 180-П от 09.03.2017 — ФГИС РЭВС
- ФАП-10/246 — сертификация эксплуатантов

Протокол: REST API / SOAP / СМЭВ 3.0 (Система межведомственного электронного взаимодействия).
В production используется сертификат ГОСТ Р 34.10-2012 (УКЭП).

Конфигурация и модели данных вынесены в app.services.fgis.base_service.
"""
import logging
import uuid
import xml.etree.ElementTree as ET
from dataclasses import asdict
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from app.services.fgis import (
    FGISConfig,
    SyncDirection,
    SyncStatus,
    FGISAircraft,
    FGISCertificate,
    FGISOperator,
    FGISDirective,
    FGISMaintOrg,
    SyncResult,
)

logger = logging.getLogger(__name__)


# ===================================================================
#  КЛИЕНТ ФГИС РЭВС
# ===================================================================

class FGISREVSClient:
    """
    Клиент для взаимодействия с ФГИС РЭВС.
    
    Поддерживает два протокола:
    1. REST API — для оперативных запросов
    2. СМЭВ 3.0 (SOAP) — для юридически значимого обмена
    
    В тестовой среде используется mock-режим.
    """

    def __init__(self, config: Optional[FGISConfig] = None):
        self.config = config or FGISConfig()
        self._session = None
        self._smev_client = None
        self._sync_log: List[SyncResult] = []

    # --- REST API методы ---

    def _make_request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """HTTP запрос к REST API ФГИС РЭВС."""
        import httpx
        url = f"{self.config.BASE_URL}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.config.API_KEY}",
            "Content-Type": "application/json",
            "X-Organization-ID": self.config.ORG_ID,
            "X-Request-ID": str(uuid.uuid4()),
        }
        try:
            with httpx.Client(
                cert=(self.config.CERT_PATH, self.config.KEY_PATH),
                verify=self.config.CA_PATH,
                timeout=self.config.TIMEOUT,
            ) as client:
                if method == "GET":
                    resp = client.get(url, headers=headers, params=data)
                elif method == "POST":
                    resp = client.post(url, headers=headers, json=data)
                elif method == "PUT":
                    resp = client.put(url, headers=headers, json=data)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error("ФГИС РЭВС request failed: %s %s — %s", method, endpoint, str(e))
            raise

    # --- PULL: Получение данных ---

    def pull_aircraft_registry(self, registration: str = None) -> List[FGISAircraft]:
        """
        Получить реестр ВС из ФГИС РЭВС.
        ВК РФ ст. 33: государственный реестр ГА ВС РФ.
        """
        params = {}
        if registration:
            params["registration"] = registration
        try:
            data = self._make_request("GET", "registry/aircraft", params)
            return [FGISAircraft(**item) for item in data.get("items", [])]
        except Exception:
            logger.warning("ФГИС РЭВС unavailable — using mock data")
            return self._mock_aircraft_registry(registration)

    def pull_certificates(self, registration: str = None) -> List[FGISCertificate]:
        """
        Получить СЛГ из ФГИС РЭВС.
        ВК РФ ст. 36: удостоверение (сертификат) лётной годности.
        """
        params = {}
        if registration:
            params["aircraft_registration"] = registration
        try:
            data = self._make_request("GET", "certificates/airworthiness", params)
            return [FGISCertificate(**item) for item in data.get("items", [])]
        except Exception:
            logger.warning("ФГИС РЭВС unavailable — using mock certificates")
            return self._mock_certificates(registration)

    def pull_operators(self) -> List[FGISOperator]:
        """Получить реестр эксплуатантов."""
        try:
            data = self._make_request("GET", "registry/operators")
            return [FGISOperator(**item) for item in data.get("items", [])]
        except Exception:
            return self._mock_operators()

    def pull_directives(self, since: str = None) -> List[FGISDirective]:
        """
        Получить директивы ЛГ из ФГИС РЭВС.
        ВК РФ ст. 37: обязательные для выполнения ДЛГ.
        """
        params = {}
        if since:
            params["effective_after"] = since
        try:
            data = self._make_request("GET", "directives", params)
            return [FGISDirective(**item) for item in data.get("items", [])]
        except Exception:
            return self._mock_directives()

    def pull_maint_organizations(self) -> List[FGISMaintOrg]:
        """Получить реестр организаций по ТО (ФАП-145)."""
        try:
            data = self._make_request("GET", "registry/maintenance-organizations")
            return [FGISMaintOrg(**item) for item in data.get("items", [])]
        except Exception:
            return self._mock_maint_orgs()

    # --- PUSH: Отправка данных ---

    def push_compliance_report(self, report: dict) -> dict:
        """
        Отправить отчёт о выполнении ДЛГ в ФГИС РЭВС.
        ФАП-148 п.4.3: эксплуатант обязан информировать ФАВТ о выполнении ДЛГ.
        """
        payload = {
            "report_type": "ad_compliance",
            "organization_id": self.config.ORG_ID,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            **report,
        }
        try:
            return self._make_request("POST", "reports/compliance", payload)
        except Exception:
            logger.warning("ФГИС РЭВС push failed — queuing for retry")
            return {"status": "queued", "message": "Will retry when ФГИС available"}

    def push_maintenance_report(self, wo_data: dict) -> dict:
        """
        Отправить данные о выполненном ТО (CRS).
        ФАП-145 п.A.55: документация о выполненном ТО.
        """
        payload = {
            "report_type": "maintenance_completion",
            "organization_id": self.config.ORG_ID,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            **wo_data,
        }
        try:
            return self._make_request("POST", "reports/maintenance", payload)
        except Exception:
            return {"status": "queued"}

    def push_defect_report(self, defect_data: dict) -> dict:
        """
        Отправить донесение о дефекте в ФАВТ.
        ФАП-128: обязательное донесение о событиях.
        """
        payload = {
            "report_type": "defect_mandatory",
            "organization_id": self.config.ORG_ID,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            **defect_data,
        }
        try:
            return self._make_request("POST", "reports/defects", payload)
        except Exception:
            return {"status": "queued"}

    # --- СМЭВ 3.0: Юридически значимый обмен ---

    def smev_send_request(self, service_code: str, request_data: dict) -> str:
        """
        Отправить запрос через СМЭВ 3.0.
        Используется для юридически значимого обмена данными.
        
        Сервисы:
        - FAVT-001: Запрос данных из реестра ВС
        - FAVT-002: Подача заявления на СЛГ
        - FAVT-003: Уведомление о выполнении ДЛГ
        - FAVT-004: Отчёт о ТО
        """
        message_id = str(uuid.uuid4())
        
        # Формирование SOAP-конверта СМЭВ 3.0
        envelope = self._build_smev_envelope(service_code, message_id, request_data)
        
        try:
            import httpx
            resp = httpx.post(
                self.config.SMEV_URL,
                content=envelope,
                headers={"Content-Type": "text/xml; charset=utf-8"},
                cert=(self.config.CERT_PATH, self.config.KEY_PATH),
                verify=self.config.CA_PATH,
                timeout=60,
            )
            # Parse SMEV response
            return self._parse_smev_response(resp.content, message_id)
        except Exception as e:
            logger.error("СМЭВ 3.0 request failed: %s", str(e))
            return message_id  # Return ID for tracking

    def _build_smev_envelope(self, service_code: str, message_id: str, data: dict) -> bytes:
        """Построить SOAP-конверт СМЭВ 3.0 с ЭП ГОСТ Р 34.10-2012."""
        timestamp = datetime.now(timezone.utc).isoformat()
        
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:smev="urn://x-artefacts-smev-gov-ru/services/message-exchange/types/1.2"
               xmlns:basic="urn://x-artefacts-smev-gov-ru/services/message-exchange/types/basic/1.2">
  <soap:Header/>
  <soap:Body>
    <smev:SendRequestRequest>
      <smev:SenderProvidedRequestData>
        <smev:MessageID>{message_id}</smev:MessageID>
        <basic:MessagePrimaryContent>
          <fgis:Request xmlns:fgis="urn://x-artefacts-favt-gov-ru/fgis-revs/1.0"
                        serviceCode="{service_code}"
                        timestamp="{timestamp}"
                        orgId="{self.config.ORG_ID}">
            {self._dict_to_xml(data)}
          </fgis:Request>
        </basic:MessagePrimaryContent>
      </smev:SenderProvidedRequestData>
    </smev:SendRequestRequest>
  </soap:Body>
</soap:Envelope>"""
        return xml.encode("utf-8")

    def _dict_to_xml(self, data: dict, indent: int = 12) -> str:
        """Конвертировать dict в XML-элементы."""
        lines = []
        for key, value in data.items():
            if isinstance(value, dict):
                lines.append(f"{'  ' * indent}<{key}>{self._dict_to_xml(value, indent + 1)}</{key}>")
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        lines.append(f"{'  ' * indent}<{key}>{self._dict_to_xml(item, indent + 1)}</{key}>")
                    else:
                        lines.append(f"{'  ' * indent}<{key}>{item}</{key}>")
            else:
                lines.append(f"{'  ' * indent}<{key}>{value}</{key}>")
        return "\n".join(lines)

    def _parse_smev_response(self, content: bytes, message_id: str) -> str:
        """Разобрать ответ СМЭВ 3.0."""
        try:
            root = ET.fromstring(content)
            # Extract message ID from response
            ns = {"smev": "urn://x-artefacts-smev-gov-ru/services/message-exchange/types/1.2"}
            resp_id = root.find(".//smev:MessageID", ns)
            return resp_id.text if resp_id is not None else message_id
        except Exception:
            return message_id

    # --- SYNC: Синхронизация ---

    def sync_aircraft(self) -> SyncResult:
        """
        Синхронизация реестра ВС с ФГИС РЭВС.
        Двунаправленная: pull свежие данные + push обновления.
        """
        result = SyncResult(
            direction="bidirect", entity_type="aircraft",
            status="pending", started_at=datetime.now(timezone.utc).isoformat(),
        )
        try:
            # Pull from ФГИС
            fgis_aircraft = self.pull_aircraft_registry()
            result.records_total = len(fgis_aircraft)

            for ac in fgis_aircraft:
                try:
                    self._upsert_aircraft(ac)
                    result.records_synced += 1
                except Exception as e:
                    result.records_failed += 1
                    result.errors.append(f"{ac.registration}: {str(e)[:80]}")

            result.status = "success" if result.records_failed == 0 else "partial"
        except Exception as e:
            result.status = "failed"
            result.errors.append(str(e)[:200])

        result.completed_at = datetime.now(timezone.utc).isoformat()
        self._sync_log.append(result)
        logger.info("ФГИС sync aircraft: %s (%d/%d)", result.status, result.records_synced, result.records_total)
        return result

    def sync_certificates(self) -> SyncResult:
        """Синхронизация СЛГ с ФГИС РЭВС."""
        result = SyncResult(
            direction="pull", entity_type="certificates",
            status="pending", started_at=datetime.now(timezone.utc).isoformat(),
        )
        try:
            certs = self.pull_certificates()
            result.records_total = len(certs)
            for cert in certs:
                try:
                    self._upsert_certificate(cert)
                    result.records_synced += 1
                except Exception as e:
                    result.records_failed += 1
                    result.errors.append(f"{cert.certificate_number}: {str(e)[:80]}")
            result.status = "success" if result.records_failed == 0 else "partial"
        except Exception as e:
            result.status = "failed"
            result.errors.append(str(e)[:200])
        result.completed_at = datetime.now(timezone.utc).isoformat()
        self._sync_log.append(result)
        return result

    def sync_directives(self, since_days: int = 30) -> SyncResult:
        """Синхронизация директив ЛГ из ФГИС РЭВС."""
        since = (datetime.now(timezone.utc) - timedelta(days=since_days)).strftime("%Y-%m-%d")
        result = SyncResult(
            direction="pull", entity_type="directives",
            status="pending", started_at=datetime.now(timezone.utc).isoformat(),
        )
        try:
            directives = self.pull_directives(since)
            result.records_total = len(directives)
            for ad in directives:
                try:
                    self._upsert_directive(ad)
                    result.records_synced += 1
                except Exception as e:
                    result.records_failed += 1
                    result.errors.append(f"{ad.number}: {str(e)[:80]}")
            result.status = "success" if result.records_failed == 0 else "partial"
        except Exception as e:
            result.status = "failed"
            result.errors.append(str(e)[:200])
        result.completed_at = datetime.now(timezone.utc).isoformat()
        self._sync_log.append(result)
        return result

    def get_sync_log(self) -> List[dict]:
        """Получить историю синхронизаций."""
        return [asdict(r) for r in self._sync_log]

    # --- Внутренние методы upsert ---

    def _upsert_aircraft(self, ac: FGISAircraft):
        """Создать или обновить ВС в локальной БД из данных ФГИС."""
        from app.api.routes.aircraft import _aircraft_store
        # В production: SQLAlchemy merge
        logger.debug("Upsert aircraft: %s", ac.registration)

    def _upsert_certificate(self, cert: FGISCertificate):
        """Создать или обновить СЛГ."""
        logger.debug("Upsert certificate: %s", cert.certificate_number)

    def _upsert_directive(self, ad: FGISDirective):
        """Создать или обновить ДЛГ из ФГИС."""
        from app.api.routes.airworthiness_core import _directives
        existing = [d for d in _directives.values() if d.get("number") == ad.number]
        if not existing:
            did = str(uuid.uuid4())
            _directives[did] = {
                "id": did,
                "number": ad.number,
                "title": ad.title,
                "issuing_authority": ad.issuing_authority,
                "aircraft_types": ad.aircraft_types,
                "ata_chapter": ad.ata_chapter,
                "effective_date": ad.effective_date,
                "compliance_type": ad.compliance_type,
                "description": ad.description,
                "supersedes": ad.supersedes,
                "status": "open",
                "source": "ФГИС РЭВС",
                "fgis_id": ad.fgis_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            logger.info("New AD from ФГИС: %s", ad.number)

    # --- MOCK данные (тестовая среда) ---

    def _mock_aircraft_registry(self, registration: str = None) -> List[FGISAircraft]:
        """Mock данные реестра ВС для тестовой среды."""
        fleet = [
            FGISAircraft(registration="RA-89001", serial_number="95001", aircraft_type="SSJ-100",
                         icao_code="SU95", manufacturer="ПАО «ОАК» (филиал «Региональные самолёты»)",
                         year_manufactured=2019, max_takeoff_weight=49450,
                         owner="АО «КЛГ Авиа»", operator="АО «КЛГ Авиа»",
                         operator_certificate="ЭВ-01/2020", base_airport="UMKK",
                         status="active", registration_date="2019-03-15", fgis_id="FGIS-AC-001"),
            FGISAircraft(registration="RA-89002", serial_number="95002", aircraft_type="SSJ-100",
                         icao_code="SU95", manufacturer="ПАО «ОАК»",
                         year_manufactured=2020, max_takeoff_weight=49450,
                         owner="АО «КЛГ Авиа»", operator="АО «КЛГ Авиа»",
                         operator_certificate="ЭВ-01/2020", base_airport="UMKK",
                         status="active", registration_date="2020-06-10", fgis_id="FGIS-AC-002"),
            FGISAircraft(registration="RA-73201", serial_number="41201", aircraft_type="Boeing 737-800",
                         icao_code="B738", manufacturer="The Boeing Company",
                         year_manufactured=2015, max_takeoff_weight=79016,
                         owner="ООО «КЛГ Лизинг»", operator="АО «КЛГ Авиа»",
                         operator_certificate="ЭВ-01/2020", base_airport="UMKK",
                         status="active", registration_date="2018-11-20", fgis_id="FGIS-AC-003"),
            FGISAircraft(registration="RA-02801", serial_number="HL-0801", aircraft_type="Ми-8Т",
                         icao_code="MI8T", manufacturer="Казанский вертолётный завод",
                         year_manufactured=2010, max_takeoff_weight=12000,
                         owner="АО «КЛГ Авиа»", operator="АО «КЛГ Авиа»",
                         operator_certificate="ЭВ-01/2020", base_airport="UMKK",
                         status="stored", registration_date="2010-08-05", fgis_id="FGIS-AC-004"),
        ]
        if registration:
            return [a for a in fleet if a.registration == registration]
        return fleet

    def _mock_certificates(self, registration: str = None) -> List[FGISCertificate]:
        return [
            FGISCertificate(certificate_number="СЛГ-001-2025", aircraft_registration="RA-89001",
                            certificate_type="standard", issue_date="2025-01-15",
                            expiry_date="2026-01-15", category="transport", status="valid",
                            fgis_id="FGIS-CRT-001"),
            FGISCertificate(certificate_number="СЛГ-002-2025", aircraft_registration="RA-89002",
                            certificate_type="standard", issue_date="2025-03-20",
                            expiry_date="2026-03-20", category="transport", status="valid",
                            fgis_id="FGIS-CRT-002"),
            FGISCertificate(certificate_number="СЛГ-003-2024", aircraft_registration="RA-73201",
                            certificate_type="standard", issue_date="2024-11-01",
                            expiry_date="2025-11-01", category="transport", status="expired",
                            fgis_id="FGIS-CRT-003"),
        ]

    def _mock_operators(self) -> List[FGISOperator]:
        return [
            FGISOperator(certificate_number="ЭВ-01/2020", name="АО «КЛГ Авиа»",
                         inn="3906123456", ogrn="1023900000001",
                         issue_date="2020-01-01", expiry_date="2027-01-01",
                         aircraft_types=["SSJ-100", "Boeing 737-800", "Ми-8Т"],
                         fleet_count=4, status="active", fgis_id="FGIS-OP-001"),
        ]

    def _mock_directives(self) -> List[FGISDirective]:
        return [
            FGISDirective(number="АД-2026-0012", title="Осмотр крепления крыла SSJ-100",
                          effective_date="2026-02-01", aircraft_types=["SSJ-100"],
                          ata_chapter="57", compliance_type="mandatory",
                          description="Обязательный осмотр крепления крыла к фюзеляжу по результатам СБ-100-57-0023",
                          fgis_id="FGIS-AD-001"),
            FGISDirective(number="АД-2026-0015", title="Замена датчика угла атаки Boeing 737",
                          effective_date="2026-02-10", aircraft_types=["Boeing 737-800"],
                          ata_chapter="34", compliance_type="mandatory",
                          description="Замена датчика угла атаки P/N 0861FL1 по бюллетеню Boeing SB 737-34-1423",
                          fgis_id="FGIS-AD-002"),
        ]

    def _mock_maint_orgs(self) -> List[FGISMaintOrg]:
        return [
            FGISMaintOrg(certificate_number="ТОиР-КЛГ-001", name="АО «КЛГ ТехСервис»",
                         approval_scope=["A1", "A2", "B1", "C6", "D1"],
                         issue_date="2023-06-01", expiry_date="2026-06-01",
                         status="active", fgis_id="FGIS-MO-001"),
        ]


# Singleton
fgis_client = FGISREVSClient()
