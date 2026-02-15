"""
Полное наполнение демо-данными для доклада: пользователи, аудиты, дефекты, заявки, риски, персонал ПЛГ.
Запускается из main.py lifespan после seed_checklists и seed_organizations.
"""
import logging
import uuid
from datetime import datetime, timezone, timedelta

from app.db.session import SessionLocal
from app.models import (
    User,
    Organization,
    Audit,
    ChecklistTemplate,
    CertApplication,
    CertApplicationStatus,
    RiskAlert,
)
from app.models.aircraft_db import Aircraft
from app.models.personnel_plg import PLGSpecialist, PLGQualification

logger = logging.getLogger(__name__)


def _get_org_id(db, name_substr: str):
    o = db.query(Organization).filter(Organization.name.ilike(f"%{name_substr}%")).first()
    return str(o.id) if o else None


def _get_aircraft_id_by_reg(db, reg: str):
    a = db.query(Aircraft).filter(Aircraft.registration_number == reg).first()
    return str(a.id) if a else None


def _get_first_aircraft_id(db):
    a = db.query(Aircraft).first()
    return str(a.id) if a else None


def _get_template_id(db):
    t = db.query(ChecklistTemplate).first()
    return str(t.id) if t else None


def seed_full_demo():
    db = SessionLocal()
    try:
        # ─── 1. Пользователи ─────────────────────────────────────────────
        demo_users = [
            ("Иванов Сергей А.", "ivanov@refly.ru", "admin", None),
            ("Петрова Елена В.", "petrova@refly.ru", "authority_inspector", None),
            ("Козлов Дмитрий И.", "kozlov@refly.ru", "operator_manager", "S7"),
            ("Сидорова Анна М.", "sidorova@refly.ru", "operator_user", "S7"),
            ("Волков Алексей Н.", "volkov@refly.ru", "mro_manager", "Домодедово"),
            ("Морозова Ольга С.", "morozova@refly.ru", "mro_user", "Домодедово"),
            ("Николаев Павел Р.", "nikolaev@refly.ru", "authority_inspector", None),
            ("Федорова Мария К.", "fedorova@refly.ru", "operator_user", "Smartavia"),
        ]
        created_users = {}
        for display_name, email, role, org_key in demo_users:
            if db.query(User).filter(User.email == email).first():
                continue
            org_id = _get_org_id(db, org_key) if org_key else None
            uid = str(uuid.uuid4())
            db.add(
                User(
                    id=uid,
                    external_subject=f"demo-{email}",
                    display_name=display_name,
                    email=email,
                    role=role,
                    organization_id=org_id,
                )
            )
            created_users[email] = uid
        db.commit()
        logger.info("seed_full_demo: users checked/created")

        # ─── 2. Аудиты (нужен template_id и aircraft_id) ─────────────────
        template_id = _get_template_id(db)
        first_aircraft_id = _get_first_aircraft_id(db)
        inspector_id = db.query(User).filter(User.role == "authority_inspector").first()
        inspector_id = str(inspector_id.id) if inspector_id else None

        if template_id and first_aircraft_id and inspector_id:
            audits_data = [
                ("Плановая проверка ТОиР S7 Airlines", "completed", "scheduled"),
                ("Внеплановая проверка после инцидента", "in_progress", "unscheduled"),
                ("Сертификационный аудит АТЦ Домодедово", "draft", "certification"),
                ("Проверка СМК авиакомпании Smartavia", "completed", "scheduled"),
                ("Инспекция рампы Шереметьево", "in_progress", "ramp"),
                ("Аудит системы управления безопасностью", "draft", "sms"),
            ]
            base_date = datetime(2025, 6, 1, tzinfo=timezone.utc)
            existing_count = db.query(Audit).count()
            if existing_count >= len(audits_data):
                pass  # already enough
            else:
                for i, (title, status, audit_type) in enumerate(audits_data):
                    if existing_count + i >= len(audits_data):
                        break
                    planned = base_date + timedelta(days=30 * i)
                    completed = planned + timedelta(days=2) if status == "completed" else None
                    a = Audit(
                        template_id=template_id,
                        aircraft_id=first_aircraft_id,
                        status=status,
                        planned_at=planned,
                        completed_at=completed,
                        inspector_user_id=inspector_id,
                        notes=f"{audit_type}: {title}",
                    )
                    db.add(a)
            db.commit()
            logger.info("seed_full_demo: audits checked/created")

        # ─── 3. Дефекты (in-memory _defects в роуте) ───────────────────
        try:
            from app.api.routes.defects import _defects

            aircraft_regs = [r[0] for r in db.query(Aircraft.registration_number).limit(5).all()]
            reg = aircraft_regs[0] if aircraft_regs else "RA-00000"
            defects_demo = [
                ("Трещина обшивки фюзеляжа секция 41", "critical", "open"),
                ("Течь гидросистемы левая стойка шасси", "high", "deferred"),
                ("Коррозия лонжерона крыла зона 2", "high", "open"),
                ("Неисправность датчика угла атаки", "critical", "rectified"),
                ("Износ тормозных дисков выше допуска", "medium", "open"),
                ("Повреждение обтекателя антенны", "low", "closed"),
                ("Утечка топлива бак №2", "critical", "open"),
                ("Вибрация двигателя №1 выше нормы", "high", "deferred"),
            ]
            for desc, severity, status in defects_demo:
                if any(d.get("description") == desc for d in _defects.values()):
                    continue
                did = str(uuid.uuid4())
                _defects[did] = {
                    "id": did,
                    "aircraft_reg": reg,
                    "description": desc,
                    "severity": severity,
                    "status": status,
                    "ata_chapter": "32" if "шасси" in desc else "53" if "топлив" in desc else "21",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            logger.info("seed_full_demo: defects (in-memory) populated")
        except Exception as e:
            logger.warning("seed_full_demo: defects skip %s", e)

        # ─── 4. Заявки на сертификацию ─────────────────────────────────
        app_org = db.query(Organization).filter(Organization.kind == "operator").first()
        app_user = db.query(User).filter(User.role == "operator_manager").first()
        if app_org and app_user:
            apps_data = [
                ("Заявка на СЛГ RA-89060", CertApplicationStatus.APPROVED, "airworthiness_certificate"),
                ("Заявка на одобрение ТОиР АТЦ Кольцово", CertApplicationStatus.UNDER_REVIEW, "mro_approval"),
                ("Продление СЛГ RA-73801", CertApplicationStatus.SUBMITTED, "renewal"),
                ("Заявка на допуск ETOPS", CertApplicationStatus.DRAFT, "special_approval"),
                ("Сертификация нового типа Ту-214", CertApplicationStatus.UNDER_REVIEW, "type_certificate"),
            ]
            for i, (subject, status, app_type) in enumerate(apps_data):
                num = f"KLG-DEMO-{datetime.now().strftime('%Y%m%d')}-{1001 + i}"
                if db.query(CertApplication).filter(CertApplication.number == num).first():
                    continue
                db.add(
                    CertApplication(
                        applicant_org_id=str(app_org.id),
                        created_by_user_id=str(app_user.id),
                        number=num,
                        status=status,
                        subject=f"[{app_type}] {subject}",
                        description=subject,
                        submitted_at=datetime.now(timezone.utc) - timedelta(days=5 - i)
                        if status != CertApplicationStatus.DRAFT
                        else None,
                    )
                )
            db.commit()
            logger.info("seed_full_demo: cert applications checked/created")

        # ─── 5. Риски (RiskAlert) ──────────────────────────────────────
        risk_titles = [
            ("Просрочка директивы лётной годности AD-2025-0142", "critical", False),
            ("Недостаточная квалификация персонала ТОиР", "high", True),
            ("Устаревшее оборудование контроля", "medium", False),
            ("Нарушение сроков периодического ТО", "high", False),
            ("Отсутствие резервных компонентов", "medium", True),
            ("Риск усталостного разрушения фюзеляжа", "critical", True),
        ]
        ac_id = _get_first_aircraft_id(db)
        for title, severity, resolved in risk_titles:
            if db.query(RiskAlert).filter(RiskAlert.title == title).first():
                continue
            db.add(
                RiskAlert(
                    entity_type="directive",
                    entity_id=str(uuid.uuid4()),
                    aircraft_id=ac_id,
                    severity=severity,
                    title=title,
                    message=title,
                    due_at=datetime.now(timezone.utc) + timedelta(days=30),
                    is_resolved=resolved,
                    resolved_at=datetime.now(timezone.utc) if resolved else None,
                )
            )
        db.commit()
        logger.info("seed_full_demo: risk_alerts checked/created")

        # ─── 6. Персонал ПЛГ (PLGSpecialist + PLGQualification) ──────────
        plg_org = db.query(Organization).filter(Organization.kind == "operator").first()
        if plg_org:
            specialists_data = [
                ("Петрова Елена В.", "ПЕТРОВА-001", "Инспектор ЛГ", "I", "LIC-2024-001", "2026-12-01"),
                ("Волков Алексей Н.", "ВОЛКОВ-001", "Инженер ТОиР", "B2", "LIC-2024-002", "2026-08-15"),
                ("Морозова Ольга С.", "МОРОЗОВА-001", "Авиатехник B1", "B1", "LIC-2024-003", "2026-03-20"),
                ("Козлов Дмитрий И.", "КОЗЛОВ-001", "Пилот CAT.A", "CAT-A", "LIC-2024-004", "2027-01-10"),
            ]
            for full_name, personnel_number, position, category, license_no, expires in specialists_data:
                if db.query(PLGSpecialist).filter(PLGSpecialist.personnel_number == personnel_number).first():
                    continue
                exp_dt = datetime.strptime(expires, "%Y-%m-%d").date()
                spec = PLGSpecialist(
                    organization_id=str(plg_org.id),
                    full_name=full_name,
                    personnel_number=personnel_number,
                    position=position,
                    category=category,
                    license_number=license_no,
                    license_expires=exp_dt,
                    status="active",
                )
                db.add(spec)
                db.flush()
                # одна квалификация на специалиста
                q = PLGQualification(
                    specialist_id=spec.id,
                    program_id="PQ-001",
                    program_name=f"ПК по {position}",
                    program_type="periodic",
                    date_start=exp_dt - timedelta(days=365),
                    date_end=exp_dt,
                    hours_total=40,
                    result="passed",
                    next_due=exp_dt,
                )
                db.add(q)
            db.commit()
            logger.info("seed_full_demo: personnel PLG checked/created")

    except Exception as e:
        db.rollback()
        logger.exception("seed_full_demo failed: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_full_demo()
