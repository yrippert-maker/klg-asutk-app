"""
Скрипт для заполнения организаций: операторы, MRO, органы сертификации.
Работает с SQLite и PostgreSQL. Данные из seed_reference_data.sql.
"""

from app.db.session import SessionLocal
from app.models.organization import Organization

_ORGANIZATIONS = [
    # Операторы (авиакомпании)
    {"kind": "operator", "name": "Аэрофлот - Российские авиалинии", "inn": "7702070139", "ogrn": "1027739036681",
     "address": "г. Москва, ул. Ленинградский проспект, д. 37, корп. 2", "email": "info@aeroflot.ru", "phone": "+7 (495) 223-55-55"},
    {"kind": "operator", "name": "S7 Airlines", "inn": "5405013127", "ogrn": "1025400000037",
     "address": "г. Новосибирск, ул. Добролюбова, д. 2", "email": "info@s7.ru", "phone": "+7 (495) 777-77-77"},
    {"kind": "operator", "name": "Уральские авиалинии", "inn": "6658004767", "ogrn": "1026600000040",
     "address": "г. Екатеринбург, ул. Сакко и Ванцетти, д. 105", "email": "info@uralairlines.ru", "phone": "+7 (343) 264-00-00"},
    {"kind": "operator", "name": "Победа", "inn": "7702070139", "ogrn": "1157746263102",
     "address": "г. Москва, ул. Ленинградский проспект, д. 37, корп. 2", "email": "info@pobeda.aero", "phone": "+7 (495) 363-00-00"},
    {"kind": "operator", "name": "Россия", "inn": "4703008763", "ogrn": "1024700000040",
     "address": "г. Санкт-Петербург, ул. Пилотов, д. 18", "email": "info@rossiya-airlines.com", "phone": "+7 (812) 333-22-11"},
    {"kind": "operator", "name": "Якутия", "inn": "1435027000", "ogrn": "1021400000040",
     "address": "г. Якутск, ул. Октябрьская, д. 9", "email": "info@yakutia.aero", "phone": "+7 (4112) 44-11-11"},
    {"kind": "operator", "name": "Азимут", "inn": "2315086352", "ogrn": "1162315077000",
     "address": "г. Ростов-на-Дону, пр-т Шолохова, д. 344", "email": "info@azimuth.aero", "phone": "+7 (863) 206-00-00"},
    {"kind": "operator", "name": "Smartavia", "inn": "2901000000", "ogrn": "1022900000040",
     "address": "г. Архангельск, ул. Воскресенская, д. 77", "email": "info@smartavia.ru", "phone": "+7 (8182) 65-00-00"},
    # MRO
    {"kind": "mro", "name": "Авиационный технический центр Шереметьево", "inn": "7712048351", "ogrn": "1027700000040",
     "address": "г. Москва, аэропорт Шереметьево", "email": "info@atc-svo.ru", "phone": "+7 (495) 578-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Домодедово", "inn": "5007004767", "ogrn": "1025000000040",
     "address": "г. Москва, аэропорт Домодедово", "email": "info@atc-dme.ru", "phone": "+7 (495) 933-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Пулково", "inn": "7802000000", "ogrn": "1027800000040",
     "address": "г. Санкт-Петербург, аэропорт Пулково", "email": "info@atc-led.ru", "phone": "+7 (812) 337-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Толмачево", "inn": "5405013127", "ogrn": "1025400000037",
     "address": "г. Новосибирск, аэропорт Толмачево", "email": "info@atc-ovb.ru", "phone": "+7 (383) 216-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Кольцово", "inn": "6658004767", "ogrn": "1026600000040",
     "address": "г. Екатеринбург, аэропорт Кольцово", "email": "info@atc-svk.ru", "phone": "+7 (343) 264-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Ростов-на-Дону", "inn": "6163000000", "ogrn": "1026100000040",
     "address": "г. Ростов-на-Дону, аэропорт Платов", "email": "info@atc-rov.ru", "phone": "+7 (863) 206-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Краснодар", "inn": "2308000000", "ogrn": "1022300000040",
     "address": "г. Краснодар, аэропорт Пашковский", "email": "info@atc-krr.ru", "phone": "+7 (861) 200-00-00"},
    {"kind": "mro", "name": "Авиационный технический центр Сочи", "inn": "2308000000", "ogrn": "1022300000040",
     "address": "г. Сочи, аэропорт Сочи", "email": "info@atc-aer.ru", "phone": "+7 (862) 240-00-00"},
    # Органы (authority)
    {"kind": "authority", "name": "Федеральное агентство воздушного транспорта (Росавиация)", "inn": "7702070139", "ogrn": "1047796000000",
     "address": "г. Москва, ул. Шаболовка, д. 4", "email": "info@favt.gov.ru", "phone": "+7 (495) 607-00-00"},
    {"kind": "authority", "name": "Межгосударственный авиационный комитет (МАК)", "inn": "7702070139", "ogrn": "1027700000040",
     "address": "г. Москва, ул. Большая Ордынка, д. 22/2", "email": "info@mak-iac.org", "phone": "+7 (495) 607-00-00"},
    {"kind": "authority", "name": "Европейское агентство по авиационной безопасности (EASA)", "inn": None, "ogrn": None,
     "address": "Konrad-Adenauer-Ufer 3, 50668 Köln, Germany", "email": "info@easa.europa.eu", "phone": "+49 221 8999 000"},
    {"kind": "authority", "name": "Федеральное управление гражданской авиации США (FAA)", "inn": None, "ogrn": None,
     "address": "800 Independence Avenue SW, Washington, DC 20591, USA", "email": "info@faa.gov", "phone": "+1 (202) 267-1000"},
    # Другие
    {"kind": "other", "name": "ОАК (Объединенная авиастроительная корпорация)", "inn": "7702070139", "ogrn": "1067746000000",
     "address": "г. Москва, ул. Большая Дмитровка, д. 26/1", "email": "info@uacrussia.ru", "phone": "+7 (495) 926-00-00"},
    {"kind": "other", "name": "Иркут (ПАО Корпорация Иркут)", "inn": "3808000000", "ogrn": "1023800000040",
     "address": "г. Иркутск, ул. Новаторов, д. 3", "email": "info@irkut.com", "phone": "+7 (3952) 39-00-00"},
    {"kind": "other", "name": "Сухой (ПАО Компания Сухой)", "inn": "7702070139", "ogrn": "1027700000040",
     "address": "г. Москва, ул. Поликарпова, д. 23А", "email": "info@sukhoi.org", "phone": "+7 (495) 926-00-00"},
]


def seed_organizations():
    db = SessionLocal()
    created = 0
    try:
        for d in _ORGANIZATIONS:
            if db.query(Organization).filter(Organization.name == d["name"], Organization.kind == d["kind"]).first():
                continue
            db.add(Organization(**d))
            created += 1
        db.commit()
        total = db.query(Organization).count()
        print(f"✅ Организации: добавлено {created}, всего {total}")
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_organizations()
