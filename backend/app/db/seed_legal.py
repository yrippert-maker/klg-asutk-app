"""
Начальное заполнение справочников для модуля юридических документов:
юрисдикции (страны/регионы). Запуск: python -m app.db.seed_legal
"""

from app.db.session import SessionLocal
from app.models import Jurisdiction


JURISDICTIONS = [
    {"code": "RU", "name": "Russian Federation", "name_ru": "Российская Федерация", "description": "Законодательство РФ"},
    {"code": "KZ", "name": "Republic of Kazakhstan", "name_ru": "Республика Казахстан", "description": "Законодательство РК"},
    {"code": "BY", "name": "Republic of Belarus", "name_ru": "Республика Беларусь", "description": "Законодательство РБ"},
    {"code": "EU", "name": "European Union", "name_ru": "Европейский союз", "description": "Право ЕС (директивы, регламенты)"},
    {"code": "US", "name": "United States", "name_ru": "США", "description": "Федеральное и штатное право США"},
    {"code": "US-CA", "name": "California (US)", "name_ru": "Калифорния (США)", "description": "Право штата Калифорния"},
    {"code": "ICAO", "name": "ICAO", "name_ru": "ИКАО", "description": "Стандарты и рекомендуемая практика ИКАО"},
    {"code": "EASA", "name": "EASA", "name_ru": "ЕАСА", "description": "Европейское агентство авиационной безопасности"},
]


def seed_jurisdictions():
    db = SessionLocal()
    try:
        for j in JURISDICTIONS:
            if db.query(Jurisdiction).filter(Jurisdiction.code == j["code"]).first():
                continue
            db.add(Jurisdiction(**j))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_jurisdictions()
    print("Legal jurisdictions seeded.")
