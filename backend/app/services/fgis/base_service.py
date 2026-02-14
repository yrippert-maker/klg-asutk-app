"""
Базовые типы и конфигурация ФГИС РЭВС.
Клиент и методы работы с API — в fgis_revs.py.
"""
from typing import List
from dataclasses import dataclass, field
from enum import Enum


class FGISConfig:
    """Параметры подключения к ФГИС РЭВС."""
    BASE_URL: str = "https://fgis-revs-test.favt.gov.ru/api/v2"
    SMEV_URL: str = "https://smev3-n0.test.gosuslugi.ru:7500/smev/v1.2/ws"
    CERT_PATH: str = "/etc/ssl/fgis/client.pem"
    KEY_PATH: str = "/etc/ssl/fgis/client.key"
    CA_PATH: str = "/etc/ssl/fgis/ca-bundle.pem"
    TIMEOUT: int = 30
    ORG_ID: str = ""
    API_KEY: str = ""
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 5


class SyncDirection(Enum):
    PULL = "pull"
    PUSH = "push"
    BIDIRECT = "bidirect"


class SyncStatus(Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    PENDING = "pending"


@dataclass
class FGISAircraft:
    """Воздушное судно в реестре ФГИС РЭВС."""
    registration: str
    serial_number: str
    aircraft_type: str
    icao_code: str = ""
    manufacturer: str = ""
    year_manufactured: int = 0
    max_takeoff_weight: float = 0
    owner: str = ""
    operator: str = ""
    operator_certificate: str = ""
    base_airport: str = ""
    status: str = "active"
    registration_date: str = ""
    deregistration_date: str = ""
    fgis_id: str = ""
    last_sync: str = ""


@dataclass
class FGISCertificate:
    """Сертификат лётной годности из ФГИС РЭВС."""
    certificate_number: str
    aircraft_registration: str
    certificate_type: str
    issue_date: str
    expiry_date: str
    issuing_authority: str = "ФАВТ"
    category: str = ""
    noise_certificate: str = ""
    limitations: List[str] = field(default_factory=list)
    status: str = "valid"
    fgis_id: str = ""


@dataclass
class FGISOperator:
    """Эксплуатант в реестре ФГИС РЭВС."""
    certificate_number: str
    name: str
    legal_address: str = ""
    actual_address: str = ""
    inn: str = ""
    ogrn: str = ""
    issue_date: str = ""
    expiry_date: str = ""
    aircraft_types: List[str] = field(default_factory=list)
    fleet_count: int = 0
    restrictions: List[str] = field(default_factory=list)
    status: str = "active"
    fgis_id: str = ""


@dataclass
class FGISDirective:
    """Директива ЛГ из ФГИС РЭВС."""
    number: str
    title: str
    issuing_authority: str = "ФАВТ"
    effective_date: str = ""
    aircraft_types: List[str] = field(default_factory=list)
    ata_chapter: str = ""
    compliance_type: str = "mandatory"
    description: str = ""
    supersedes: str = ""
    fgis_id: str = ""


@dataclass
class FGISMaintOrg:
    """Организация по ТО (ФАП-145) из ФГИС РЭВС."""
    certificate_number: str
    name: str
    approval_scope: List[str] = field(default_factory=list)
    issue_date: str = ""
    expiry_date: str = ""
    status: str = "active"
    fgis_id: str = ""


@dataclass
class SyncResult:
    """Результат синхронизации."""
    direction: str
    entity_type: str
    status: str
    records_total: int = 0
    records_synced: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    errors: List[str] = field(default_factory=list)
    started_at: str = ""
    completed_at: str = ""
    duration_seconds: float = 0
