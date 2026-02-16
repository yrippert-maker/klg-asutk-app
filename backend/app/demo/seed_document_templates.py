"""
Seed 25 шаблонов документов авиационной отрасли в стиле REFLY.
"""
import logging
from app.db.session import SessionLocal
from app.models.document_template import DocumentTemplate

logger = logging.getLogger(__name__)

_STYLE = """
<style>
  .doc { font-family: 'Inter', -apple-system, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm; color: #333; font-size: 12pt; line-height: 1.5; }
  .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 20px; }
  .logo { font-size: 28pt; font-weight: 900; color: #1e3a5f; letter-spacing: 3px; }
  .org-name { font-size: 11pt; color: #1e3a5f; font-weight: 600; margin-top: 4px; }
  .org-details { font-size: 8pt; color: #888; margin-top: 2px; }
  .doc-title { text-align: center; font-size: 16pt; font-weight: 700; margin: 24px 0 8px; text-transform: uppercase; }
  .doc-subtitle { text-align: center; font-size: 10pt; color: #666; margin-bottom: 20px; }
  .doc-number { text-align: right; font-size: 10pt; color: #666; margin-bottom: 16px; }
  .field { background: #f0f4ff; border-bottom: 1px solid #1e3a5f; padding: 2px 8px; min-width: 120px; display: inline-block; cursor: text; }
  .field:focus { background: #e0e8ff; outline: 2px solid #4a90e2; }
  .section-title { font-size: 12pt; font-weight: 700; color: #1e3a5f; margin: 16px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  table.doc-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  table.doc-table th { background: #1e3a5f; color: white; padding: 8px 12px; text-align: left; font-size: 10pt; }
  table.doc-table td { padding: 8px 12px; border: 1px solid #ddd; font-size: 10pt; }
  table.doc-table tr:nth-child(even) { background: #f8fafc; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
  .sig-block { width: 45%; }
  .sig-line { border-bottom: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 10pt; }
  .sig-label { font-size: 8pt; color: #888; }
  .footer { text-align: center; font-size: 8pt; color: #aaa; margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; }
  .stamp-area { border: 1px dashed #ccc; width: 100px; height: 100px; display: inline-block; text-align: center; line-height: 100px; font-size: 8pt; color: #ccc; }
  @media print { .doc { padding: 15mm; } .field { background: transparent; border-bottom: 1px solid #333; } }
</style>
"""

_HEADER = """
<div class="header">
  <div class="logo">REFLY</div>
  <div class="org-name">АСУ ТК КЛГ — Контроль лётной годности</div>
  <div class="org-details">АО «REFLY» · г. Калининград · тел. +7 (4012) ХХХ-ХХ-ХХ · info@refly.ru</div>
</div>
"""

_FOOTER = """
<div class="footer">АО «REFLY» · АСУ ТК КЛГ · Стр. ___ из ___</div>
"""


def _wrap(title: str, subtitle: str | None, content: str) -> str:
    sub = f'<div class="doc-subtitle">{subtitle}</div>' if subtitle else ""
    return (
        _STYLE
        + '<div class="doc">'
        + _HEADER
        + f'<div class="doc-title">{title}</div>'
        + sub
        + '<div class="doc-number">№ <span class="field" contenteditable="true">[___________]</span> от <span class="field" contenteditable="true">[дата]</span></div>'
        + content
        + _FOOTER
        + "</div>"
    )


def _templates_data() -> list[dict]:
    return [
        {
            "code": "APP-246",
            "name": "Заявка на получение сертификата эксплуатанта (ФАП-246)",
            "category": "application",
            "standard": "RF",
            "description": "Заявка на получение сертификата эксплуатанта ВК РФ",
            "sort_order": 1,
            "html_content": _wrap(
                "Заявка на получение сертификата эксплуатанта",
                "ФАП-246",
                """
                <p>Наименование организации: <span class="field" contenteditable="true">[___________]</span></p>
                <p>ИНН: <span class="field" contenteditable="true">[___]</span> ОГРН: <span class="field" contenteditable="true">[___]</span></p>
                <p>Адрес: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Типы ВС: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Виды авиаработ: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Ответственное лицо: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Подпись руководителя</div><div class="sig-label">ФИО</div></div><div class="stamp-area">М.П.</div></div>
                """,
            ),
        },
        {
            "code": "APP-145",
            "name": "Заявка на одобрение организации ТОиР (ФАП-145)",
            "category": "application",
            "standard": "RF",
            "description": "Заявка на одобрение организации по техническому обслуживанию",
            "sort_order": 2,
            "html_content": _wrap(
                "Заявка на одобрение организации ТОиР",
                "ФАП-145",
                """
                <p>Наименование: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Область одобрения: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Типы ВС: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Категории работ: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Подпись</div></div></div>
                """,
            ),
        },
        {
            "code": "APP-SLG",
            "name": "Заявка на выдачу/продление СЛГ",
            "category": "application",
            "standard": "RF",
            "description": "Заявка на выдачу или продление сертификата лётной годности",
            "sort_order": 3,
            "html_content": _wrap(
                "Заявка на выдачу/продление сертификата лётной годности",
                None,
                """
                <p>Рег. номер ВС: <span class="field" contenteditable="true">[___]</span> Тип: <span class="field" contenteditable="true">[___]</span></p>
                <p>Серийный №: <span class="field" contenteditable="true">[___]</span> Собственник: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Дата последнего ТО: <span class="field" contenteditable="true">[дата]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Подпись</div></div></div>
                """,
            ),
        },
        {
            "code": "APP-MOD",
            "name": "Заявка на одобрение модификации ВС",
            "category": "application",
            "standard": "RF",
            "description": "Заявка на одобрение модификации воздушного судна",
            "sort_order": 4,
            "html_content": _wrap(
                "Заявка на одобрение модификации ВС",
                None,
                """
                <p>Описание модификации: <span class="field" contenteditable="true">[___________]</span></p>
                <p>STC: <span class="field" contenteditable="true">[___]</span> Основание: <span class="field" contenteditable="true">[___]</span></p>
                <p>ВС (рег. №): <span class="field" contenteditable="true">[___]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Подпись</div></div></div>
                """,
            ),
        },
        {
            "code": "CERT-SLG",
            "name": "Сертификат лётной годности (СЛГ) — бланк",
            "category": "certificate",
            "standard": "RF",
            "description": "Бланк сертификата лётной годности",
            "sort_order": 5,
            "html_content": _wrap(
                "Сертификат лётной годности",
                None,
                """
                <p>Государство регистрации: <span class="field" contenteditable="true">[___]</span> Рег. знак: <span class="field" contenteditable="true">[___]</span></p>
                <p>Тип: <span class="field" contenteditable="true">[___]</span> Серийный №: <span class="field" contenteditable="true">[___]</span></p>
                <p>Категория: <span class="field" contenteditable="true">[___]</span></p>
                <p>Дата выдачи: <span class="field" contenteditable="true">[дата]</span> Срок действия: <span class="field" contenteditable="true">[дата]</span></p>
                <p>Орган выдачи: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="stamp-area">Печать</div>
                """,
            ),
        },
        {
            "code": "CERT-CRS",
            "name": "Свидетельство о допуске к эксплуатации (CRS)",
            "category": "certificate",
            "standard": "RF",
            "description": "ФАП-145 / EASA Part-145.A.50 — Certificate of Release to Service",
            "sort_order": 6,
            "html_content": _wrap(
                "Свидетельство о допуске к эксплуатации",
                "ФАП-145 / EASA Part-145.A.50",
                """
                <p>Организация ТОиР: <span class="field" contenteditable="true">[___________]</span></p>
                <p>ВС: <span class="field" contenteditable="true">[рег. №]</span> Тип: <span class="field" contenteditable="true">[___]</span></p>
                <p>Выполненные работы: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Наряд №: <span class="field" contenteditable="true">[___]</span> Дата: <span class="field" contenteditable="true">[дата]</span></p>
                <p>Подпись уполномоченного лица: _____________________</p>
                <div class="stamp-area">М.П.</div>
                """,
            ),
        },
        {
            "code": "CERT-EASA1",
            "name": "EASA Form 1 — Authorized Release Certificate",
            "category": "certificate",
            "standard": "EASA",
            "description": "Форма 1 EASA — сертификат авторизованного выпуска",
            "sort_order": 7,
            "html_content": _wrap(
                "EASA Form 1 — Authorized Release Certificate",
                "EASA",
                """
                <table class="doc-table">
                  <tr><th>Part Number</th><th>Description</th><th>Quantity</th><th>Serial No</th><th>Status</th><th>Remarks</th></tr>
                  <tr><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td></tr>
                </table>
                <p>Authorized Signature: <span class="field" contenteditable="true">[___________]</span></p>
                """,
            ),
        },
        {
            "code": "CERT-8130",
            "name": "FAA Form 8130-3 — Airworthiness Approval Tag",
            "category": "certificate",
            "standard": "FAA",
            "description": "Форма 8130-3 FAA — ярлык одобрения лётной годности",
            "sort_order": 8,
            "html_content": _wrap(
                "FAA Form 8130-3 — Airworthiness Approval Tag",
                "FAA",
                """
                <p>Part No: <span class="field" contenteditable="true">[___]</span> Serial No: <span class="field" contenteditable="true">[___]</span></p>
                <p>Description: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Status: <span class="field" contenteditable="true">[___]</span> Remarks: <span class="field" contenteditable="true">[___]</span></p>
                <p>Approved by: <span class="field" contenteditable="true">[___________]</span></p>
                """,
            ),
        },
        {
            "code": "ACT-INSP",
            "name": "Акт инспекционной проверки ВС",
            "category": "act",
            "standard": "RF",
            "description": "Акт инспекционной проверки воздушного судна",
            "sort_order": 9,
            "html_content": _wrap(
                "Акт инспекционной проверки ВС",
                None,
                """
                <p>Дата: <span class="field" contenteditable="true">[дата]</span> Место: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Борт: <span class="field" contenteditable="true">[рег. №]</span> Инспектор: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Результат: <span class="field" contenteditable="true">[годен / не годен]</span></p>
                <p>Замечания: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Инспектор</div></div><div class="sig-block"><div class="sig-line">Представитель организации</div></div></div>
                """,
            ),
        },
        {
            "code": "ACT-AUDIT",
            "name": "Акт аудита организации",
            "category": "act",
            "standard": "RF",
            "description": "Акт проведения аудита организации",
            "sort_order": 10,
            "html_content": _wrap(
                "Акт аудита организации",
                None,
                """
                <p>Организация: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Дата: <span class="field" contenteditable="true">[дата]</span> Аудитор: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Область проверки: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Несоответствия (level 1/2): <span class="field" contenteditable="true">[___________]</span></p>
                <p>Корректирующие действия, срок: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Аудитор</div></div><div class="sig-block"><div class="sig-line">Представитель организации</div></div></div>
                """,
            ),
        },
        {
            "code": "ACT-DEFECT",
            "name": "Акт дефектации",
            "category": "act",
            "standard": "RF",
            "description": "Акт дефектации компонента/ВС",
            "sort_order": 11,
            "html_content": _wrap(
                "Акт дефектации",
                None,
                """
                <p>ВС: <span class="field" contenteditable="true">[рег. №]</span> ATA chapter: <span class="field" contenteditable="true">[___]</span></p>
                <p>Описание дефекта: <span class="field" contenteditable="true">[___________]</span></p>
                <p>MEL категория: <span class="field" contenteditable="true">[___]</span> Решение: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "ACT-ACCEPT",
            "name": "Акт приёмки ВС после ТО",
            "category": "act",
            "standard": "RF",
            "description": "Акт приёмки воздушного судна после технического обслуживания",
            "sort_order": 12,
            "html_content": _wrap(
                "Акт приёмки ВС после ТО",
                None,
                """
                <p>Наряд №: <span class="field" contenteditable="true">[___]</span> ВС: <span class="field" contenteditable="true">[рег. №]</span></p>
                <p>Выполненные работы: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Замечания: <span class="field" contenteditable="true">[___________]</span></p>
                <p>CRS: <span class="field" contenteditable="true">[___]</span></p>
                <div class="signatures"><div class="sig-block"><div class="sig-line">Заказчик</div></div><div class="sig-block"><div class="sig-line">Исполнитель</div></div></div>
                """,
            ),
        },
        {
            "code": "LTR-FAVT",
            "name": "Сопроводительное письмо в ФАВТ (Росавиация)",
            "category": "letter",
            "standard": "RF",
            "description": "Сопроводительное письмо в Федеральное агентство воздушного транспорта",
            "sort_order": 13,
            "html_content": _wrap(
                "Сопроводительное письмо",
                "в ФАВТ (Росавиация)",
                """
                <p>Исх. № <span class="field" contenteditable="true">[___]</span> от <span class="field" contenteditable="true">[дата]</span></p>
                <p>Кому: <span class="field" contenteditable="true">[___________]</span></p>
                <p>От кого: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Тема: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Текст: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Приложения: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "LTR-MRO",
            "name": "Письмо-заказ в организацию ТОиР",
            "category": "letter",
            "standard": "RF",
            "description": "Письмо-заказ на выполнение работ организацией ТОиР",
            "sort_order": 14,
            "html_content": _wrap(
                "Письмо-заказ в организацию ТОиР",
                None,
                """
                <p>Наименование ТОиР: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Запрос на выполнение работ: <span class="field" contenteditable="true">[___________]</span></p>
                <p>ВС: <span class="field" contenteditable="true">[рег. №]</span> Сроки: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Контакт: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "LTR-SB",
            "name": "Уведомление о выполнении сервисного бюллетеня (SB)",
            "category": "letter",
            "standard": "RF",
            "description": "Уведомление о выполнении SB",
            "sort_order": 15,
            "html_content": _wrap(
                "Уведомление о выполнении SB",
                None,
                """
                <p>№ SB: <span class="field" contenteditable="true">[___]</span> ВС: <span class="field" contenteditable="true">[рег. №]</span></p>
                <p>Дата выполнения: <span class="field" contenteditable="true">[дата]</span></p>
                <p>Ссылка на наряд: <span class="field" contenteditable="true">[___]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "LTR-AD",
            "name": "Отчёт о выполнении директивы ЛГ (AD/ДЛГ)",
            "category": "letter",
            "standard": "RF",
            "description": "Отчёт о выполнении воздушной директивы",
            "sort_order": 16,
            "html_content": _wrap(
                "Отчёт о выполнении директивы ЛГ",
                "AD / ДЛГ",
                """
                <p>№ AD: <span class="field" contenteditable="true">[___]</span> ВС: <span class="field" contenteditable="true">[рег. №]</span></p>
                <p>Метод выполнения: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Дата: <span class="field" contenteditable="true">[дата]</span></p>
                <p>Подтверждение: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "FORM-TECHLOG",
            "name": "Technical Log / Бортовой журнал",
            "category": "form",
            "standard": "ICAO",
            "description": "Бортовой журнал (ICAO)",
            "sort_order": 17,
            "html_content": _wrap(
                "Technical Log / Бортовой журнал",
                "ICAO",
                """
                <table class="doc-table">
                  <tr><th>Flight No</th><th>Date</th><th>Departure</th><th>Arrival</th><th>Block Time</th><th>Defects</th><th>Actions</th><th>CRS</th></tr>
                  <tr><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td><td><span class="field" contenteditable="true">[___]</span></td></tr>
                </table>
                """,
            ),
        },
        {
            "code": "FORM-MEL",
            "name": "MEL Deferral Form / Форма отложенного дефекта",
            "category": "form",
            "standard": "ICAO",
            "description": "Форма отложенного дефекта по MEL",
            "sort_order": 18,
            "html_content": _wrap(
                "MEL Deferral Form",
                None,
                """
                <p>ВС: <span class="field" contenteditable="true">[___]</span> ATA: <span class="field" contenteditable="true">[___]</span></p>
                <p>Item: <span class="field" contenteditable="true">[___]</span> Category (A/B/C/D): <span class="field" contenteditable="true">[___]</span></p>
                <p>Deferred By: <span class="field" contenteditable="true">[___]</span> Expiry Date: <span class="field" contenteditable="true">[дата]</span></p>
                <p>Rectified By: <span class="field" contenteditable="true">[___]</span></p>
                """,
            ),
        },
        {
            "code": "FORM-WEIGHT",
            "name": "Weight & Balance Sheet / Весовая ведомость",
            "category": "form",
            "standard": "ICAO",
            "description": "Весовая ведомость ВС",
            "sort_order": 19,
            "html_content": _wrap(
                "Weight & Balance Sheet",
                "Весовая ведомость",
                """
                <p>ВС: <span class="field" contenteditable="true">[___]</span></p>
                <p>Empty Weight: <span class="field" contenteditable="true">[___]</span> CG: <span class="field" contenteditable="true">[___]</span></p>
                <p>Fuel: <span class="field" contenteditable="true">[___]</span> Payload: <span class="field" contenteditable="true">[___]</span></p>
                <p>Max TOW: <span class="field" contenteditable="true">[___]</span> Actual TOW: <span class="field" contenteditable="true">[___]</span></p>
                """,
            ),
        },
        {
            "code": "FORM-WO",
            "name": "Work Order / Наряд-задание на ТО",
            "category": "form",
            "standard": "RF",
            "description": "Наряд-задание на техническое обслуживание",
            "sort_order": 20,
            "html_content": _wrap(
                "Work Order / Наряд-задание на ТО",
                None,
                """
                <p>WO №: <span class="field" contenteditable="true">[___]</span> ВС: <span class="field" contenteditable="true">[рег. №]</span></p>
                <p>Тип работ: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Плановые ч/ч: <span class="field" contenteditable="true">[___]</span> Исполнитель: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Инструмент, запчасти: <span class="field" contenteditable="true">[___________]</span></p>
                <p>CRS: <span class="field" contenteditable="true">[___]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "RPT-ANNUAL",
            "name": "Годовой отчёт о состоянии парка ВС",
            "category": "report",
            "standard": "RF",
            "description": "Годовой отчёт по парку воздушных судов",
            "sort_order": 21,
            "html_content": _wrap(
                "Годовой отчёт о состоянии парка ВС",
                None,
                """
                <div class="section-title">Парк ВС</div><p><span class="field" contenteditable="true">[___________]</span></p>
                <div class="section-title">Наработка, ТО</div><p><span class="field" contenteditable="true">[___________]</span></p>
                <div class="section-title">Инциденты, AD/SB, риски</div><p><span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Руководитель</div></div>
                """,
            ),
        },
        {
            "code": "RPT-SMS",
            "name": "Отчёт по SMS (Safety Management System)",
            "category": "report",
            "standard": "ICAO",
            "description": "Отчёт по системе управления безопасностью",
            "sort_order": 22,
            "html_content": _wrap(
                "Отчёт по SMS",
                "Safety Management System",
                """
                <div class="section-title">Показатели безопасности (SPI)</div><p><span class="field" contenteditable="true">[___________]</span></p>
                <div class="section-title">Происшествия, риски</div><p><span class="field" contenteditable="true">[___________]</span></p>
                <div class="section-title">Корректирующие действия</div><p><span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "RPT-RISK",
            "name": "Отчёт об оценке риска",
            "category": "report",
            "standard": "RF",
            "description": "Отчёт об оценке риска",
            "sort_order": 23,
            "html_content": _wrap(
                "Отчёт об оценке риска",
                None,
                """
                <p>Опасность: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Вероятность: <span class="field" contenteditable="true">[___]</span> Серьёзность: <span class="field" contenteditable="true">[___]</span></p>
                <p>Матрица риска: <span class="field" contenteditable="true">[___]</span></p>
                <p>Меры: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Остаточный риск: <span class="field" contenteditable="true">[___]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
        {
            "code": "ORD-PILOT",
            "name": "Приказ о допуске экипажа к полётам",
            "category": "order",
            "standard": "RF",
            "description": "Приказ о допуске пилота/экипажа к полётам",
            "sort_order": 24,
            "html_content": _wrap(
                "Приказ о допуске экипажа к полётам",
                None,
                """
                <p>ФИО: <span class="field" contenteditable="true">[___________]</span> Должность: <span class="field" contenteditable="true">[___]</span></p>
                <p>Свидетельство №: <span class="field" contenteditable="true">[___]</span></p>
                <p>Типы ВС: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Дата: <span class="field" contenteditable="true">[дата]</span></p>
                <div class="sig-block"><div class="sig-line">Руководитель</div></div>
                """,
            ),
        },
        {
            "code": "ORD-INSPECT",
            "name": "Распоряжение о проведении инспекции",
            "category": "order",
            "standard": "RF",
            "description": "Распоряжение о проведении инспекционной проверки",
            "sort_order": 25,
            "html_content": _wrap(
                "Распоряжение о проведении инспекции",
                None,
                """
                <p>Основание: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Объект: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Дата: <span class="field" contenteditable="true">[дата]</span> Инспектор: <span class="field" contenteditable="true">[___________]</span></p>
                <p>Задачи: <span class="field" contenteditable="true">[___________]</span></p>
                <div class="sig-block"><div class="sig-line">Подпись</div></div>
                """,
            ),
        },
    ]


def seed_document_templates():
    db = SessionLocal()
    try:
        # Удалить шаблоны ICAO / EASA / FAA — оставляем только российские (Part-M RU, ФАП)
        deleted = db.query(DocumentTemplate).filter(DocumentTemplate.standard.in_(["EASA", "FAA", "ICAO"])).delete(synchronize_session=False)
        if deleted:
            logger.info("Removed %s non-Russian document templates (EASA/FAA/ICAO)", deleted)
        db.commit()

        for d in _templates_data():
            if d.get("standard") in ("EASA", "FAA", "ICAO"):
                continue
            if db.query(DocumentTemplate).filter(DocumentTemplate.code == d["code"]).first():
                continue
            db.add(
                DocumentTemplate(
                    code=d["code"],
                    name=d["name"],
                    category=d["category"],
                    standard=d["standard"],
                    description=d.get("description"),
                    html_content=d["html_content"],
                    version=1,
                    is_active=True,
                    sort_order=d["sort_order"],
                )
            )
        db.commit()
        logger.info("Document templates seed complete: up to 25 templates")
    except Exception as e:
        db.rollback()
        logger.exception("Document templates seed failed: %s", e)
        raise
    finally:
        db.close()
