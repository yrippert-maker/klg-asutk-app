"""
Скрипт для заполнения пользователей. Работает с SQLite и PostgreSQL.
Данные из seed_reference_data.sql. Требует выполненный seed_organizations.
"""

from app.db.session import SessionLocal
from app.models.user import User
from app.models.organization import Organization

# (external_subject, display_name, email, role, organization_name)
_USERS = [
    ("admin@system", "Администратор системы", "admin@klg.local", "admin", None),
    ("admin@rosaviation", "Администратор Росавиации", "admin@favt.gov.ru", "admin", "Федеральное агентство воздушного транспорта (Росавиация)"),
    ("inspector1@rosaviation", "Иванов Иван Иванович", "i.ivanov@favt.gov.ru", "authority_inspector", "Федеральное агентство воздушного транспорта (Росавиация)"),
    ("inspector2@rosaviation", "Петров Петр Петрович", "p.petrov@favt.gov.ru", "authority_inspector", "Федеральное агентство воздушного транспорта (Росавиация)"),
    ("inspector3@rosaviation", "Сидоров Сидор Сидорович", "s.sidorov@favt.gov.ru", "authority_inspector", "Федеральное агентство воздушного транспорта (Росавиация)"),
    ("manager1@aeroflot", "Смирнов Алексей Владимирович", "a.smirnov@aeroflot.ru", "operator_manager", "Аэрофлот - Российские авиалинии"),
    ("manager2@s7", "Козлов Дмитрий Сергеевич", "d.kozlov@s7.ru", "operator_manager", "S7 Airlines"),
    ("manager3@ural", "Новиков Андрей Николаевич", "a.novikov@uralairlines.ru", "operator_manager", "Уральские авиалинии"),
    ("user1@aeroflot", "Волков Сергей Александрович", "s.volkov@aeroflot.ru", "operator_user", "Аэрофлот - Российские авиалинии"),
    ("user2@aeroflot", "Лебедев Михаил Игоревич", "m.lebedev@aeroflot.ru", "operator_user", "Аэрофлот - Российские авиалинии"),
    ("user1@s7", "Соколов Павел Викторович", "p.sokolov@s7.ru", "operator_user", "S7 Airlines"),
    ("user1@ural", "Михайлов Игорь Олегович", "i.mikhailov@uralairlines.ru", "operator_user", "Уральские авиалинии"),
    ("manager1@atc-svo", "Федоров Владимир Петрович", "v.fedorov@atc-svo.ru", "mro_manager", "Авиационный технический центр Шереметьево"),
    ("manager2@atc-dme", "Морозов Николай Анатольевич", "n.morozov@atc-dme.ru", "mro_manager", "Авиационный технический центр Домодедово"),
    ("user1@atc-svo", "Алексеев Олег Дмитриевич", "o.alekseev@atc-svo.ru", "mro_user", "Авиационный технический центр Шереметьево"),
    ("user2@atc-svo", "Павлов Роман Сергеевич", "r.pavlov@atc-svo.ru", "mro_user", "Авиационный технический центр Шереметьево"),
    ("user1@atc-dme", "Семенов Артем Валерьевич", "a.semenov@atc-dme.ru", "mro_user", "Авиационный технический центр Домодедово"),
]


def _org_id_by_name(db, name: str | None) -> str | None:
    if not name:
        return None
    o = db.query(Organization).filter(Organization.name == name).first()
    return str(o.id) if o else None


def seed_users():
    db = SessionLocal()
    created = 0
    try:
        for ext, display, email, role, org_name in _USERS:
            if db.query(User).filter(User.external_subject == ext).first():
                continue
            oid = _org_id_by_name(db, org_name)
            db.add(User(external_subject=ext, display_name=display, email=email, role=role, organization_id=oid))
            created += 1
        db.commit()
        total = db.query(User).count()
        print(f"✅ Пользователи: добавлено {created}, всего {total}")
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
