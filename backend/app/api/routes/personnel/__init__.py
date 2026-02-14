"""
Структура модуля персонала ПЛГ (сертификация, аттестация, повышение квалификации).
Роуты пока подключены через personnel_plg; при рефакторинге перенести сюда.
"""
# В будущем: from .router import router
from ..personnel_plg import router

__all__ = ["router"]
