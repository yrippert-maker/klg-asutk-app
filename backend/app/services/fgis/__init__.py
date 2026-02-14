"""ФГИС РЭВС: конфигурация и модели в base_service, клиент в fgis_revs."""
from .base_service import (
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

__all__ = [
    "FGISConfig",
    "SyncDirection",
    "SyncStatus",
    "FGISAircraft",
    "FGISCertificate",
    "FGISOperator",
    "FGISDirective",
    "FGISMaintOrg",
    "SyncResult",
]
