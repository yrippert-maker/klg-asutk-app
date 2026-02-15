"""
Наполнение БД demo-данными: организации, типы ВС, воздушные суда, заявки, пользователи.
Запуск: python -m app.demo.seed
"""
import logging
import sys
from datetime import datetime, timezone, timedelta

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import (
    Organization,
    Aircraft,
    AircraftType,
    CertApplication,
    CertApplicationStatus,
    Notification,
    User,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def seed():
    logger.info("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Проверка: если данные уже есть — пропускаем
        if db.query(Organization).first():
            logger.info("Demo data already exists, skipping.")
            return

        now = datetime.now(timezone.utc)

        # ── 5 тестовых пользователей (для JWT и created_by) ──
        demo_users = [
            User(
                id="demo-admin-001",
                external_subject="demo-admin-001",
                display_name="Админ Системы",
                email="admin@demo.klg.refly.ru",
                role="admin",
                organization_id=None,
            ),
            User(
                id="demo-inspector-001",
                external_subject="demo-inspector-001",
                display_name="Иванов И.П. (Инспектор ФАВТ)",
                email="inspector@demo.klg.refly.ru",
                role="authority_inspector",
                organization_id=None,
            ),
            User(
                id="demo-operator-mgr-001",
                external_subject="demo-operator-mgr-001",
                display_name="Петров А.С. (Оператор — руководитель)",
                email="operator-mgr@demo.klg.refly.ru",
                role="operator_manager",
                organization_id="org-airline-001",
            ),
            User(
                id="demo-mro-mgr-001",
                external_subject="demo-mro-mgr-001",
                display_name="Сидоров В.Н. (ТОиР — руководитель)",
                email="mro-mgr@demo.klg.refly.ru",
                role="mro_manager",
                organization_id="org-mro-001",
            ),
            User(
                id="demo-operator-user-001",
                external_subject="demo-operator-user-001",
                display_name="Козлова Е.А. (Оператор — специалист)",
                email="operator@demo.klg.refly.ru",
                role="operator_user",
                organization_id="org-airline-001",
            ),
        ]
        db.add_all(demo_users)
        logger.info("Added 5 demo users")

        # ── Организации (kind, не type) ───────────────────────
        orgs = [
            Organization(
                id="org-airline-001",
                name="АК «КалинингрАвиа»",
                kind="operator",
                inn="3901234567",
                ogrn="1023901234567",
                address="г. Калининград, ул. Авиационная, д. 1",
            ),
            Organization(
                id="org-mro-001",
                name="ТОиР «Балтик Техник»",
                kind="mro",
                inn="3907654321",
                ogrn="1023907654321",
                address="г. Калининград, аэропорт Храброво, ангар 3",
            ),
            Organization(
                id="org-authority-001",
                name="МТУ ФАВТ Северо-Запад",
                kind="authority",
                inn="7801234567",
                ogrn="1027801234567",
                address="г. Санкт-Петербург, Московский пр., д. 10",
            ),
        ]
        db.add_all(orgs)
        logger.info("Added 3 organizations")

        # ── Типы ВС (model, manufacturer, icao_code) ───────────
        types = [
            AircraftType(
                id="type-ssj100",
                model="Sukhoi Superjet 100",
                manufacturer="ПАО «Яковлев»",
                icao_code="SU95",
            ),
            AircraftType(
                id="type-mc21",
                model="МС-21-300",
                manufacturer="ПАО «Яковлев»",
                icao_code="M321",
            ),
            AircraftType(
                id="type-l410",
                model="L-410 UVP-E20",
                manufacturer="Aircraft Industries",
                icao_code="L410",
            ),
        ]
        db.add_all(types)
        logger.info("Added 3 aircraft types")

        # ── Воздушные суда (без flight_hours — нет в модели aircraft_db) ──
        aircraft = [
            Aircraft(
                id="ac-001",
                registration_number="RA-89001",
                serial_number="95001",
                aircraft_type_id="type-ssj100",
                operator_id="org-airline-001",
                status="active",
                year_of_manufacture=2020,
            ),
            Aircraft(
                id="ac-002",
                registration_number="RA-89002",
                serial_number="95002",
                aircraft_type_id="type-ssj100",
                operator_id="org-airline-001",
                status="active",
                year_of_manufacture=2021,
            ),
            Aircraft(
                id="ac-003",
                registration_number="RA-73001",
                serial_number="21001",
                aircraft_type_id="type-mc21",
                operator_id="org-airline-001",
                status="maintenance",
                year_of_manufacture=2024,
            ),
            Aircraft(
                id="ac-004",
                registration_number="RA-67001",
                serial_number="3001",
                aircraft_type_id="type-l410",
                operator_id="org-airline-001",
                status="active",
                year_of_manufacture=2019,
            ),
        ]
        db.add_all(aircraft)
        logger.info("Added 4 aircraft")

        # ── Заявки на сертификацию ─────────────────────────────
        today_str = now.strftime("%Y%m%d")
        apps = [
            CertApplication(
                id="app-001",
                number=f"KLG-{today_str}-0001",
                applicant_org_id="org-mro-001",
                created_by_user_id="demo-mro-mgr-001",
                status=CertApplicationStatus.SUBMITTED,
                subject="Сертификация ТОиР «Балтик Техник» по ФАП-145",
                description="Первичная сертификация организации по техническому обслуживанию. "
                "Scope: SSJ100, L-410. Категории: A (base), C (engine).",
                submitted_at=now - timedelta(days=5),
            ),
            CertApplication(
                id="app-002",
                number=f"KLG-{today_str}-0002",
                applicant_org_id="org-airline-001",
                created_by_user_id="demo-operator-mgr-001",
                status=CertApplicationStatus.DRAFT,
                subject="Продление сертификата эксплуатанта АК «КалинингрАвиа»",
                description="Продление СЭ. 4 ВС в парке: 2x SSJ100, 1x МС-21, 1x L-410.",
            ),
        ]
        db.add_all(apps)
        logger.info("Added 2 cert applications")

        # ── Уведомления ───────────────────────────────────────
        notifs = [
            Notification(
                recipient_user_id="demo-inspector-001",
                title="Новая заявка: ТОиР «Балтик Техник»",
                body="Заявка KLG-...-0001 подана на рассмотрение.",
            ),
            Notification(
                recipient_user_id="demo-operator-mgr-001",
                title="Приближается срок инспекции RA-89001",
                body="Плановая инспекция через 14 дней.",
            ),
        ]
        db.add_all(notifs)

        db.commit()
        logger.info("✅ Demo seed complete: 5 users, 3 orgs, 3 types, 4 aircraft, 2 applications")

        from app.demo.seed_checklists import seed_checklists
        seed_checklists()

    except Exception as e:
        db.rollback()
        logger.error("Seed failed: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
