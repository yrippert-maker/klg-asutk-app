"""
Скрипт для заполнения воздушных судов (самолёты и вертолёты).
Работает с SQLite и PostgreSQL. Требует seed_organizations и seed_aircraft_types.
Данные из seed_aircraft.sql и seed_helicopters.sql.
"""

from app.db.session import SessionLocal
from app.models.aircraft import Aircraft, AircraftType
from app.models.organization import Organization

# (registration_number, manufacturer, model, operator_name, serial_number, status, total_time, total_cycles)
_AIRCRAFT = [
    # seed_aircraft.sql: Smartavia, Boeing 737-800
    ("RA-89060", "Boeing", "737-800", "Smartavia", "LN-12345", "in_service", 15000.5, 8500),
    ("RA-89061", "Boeing", "737-800", "Smartavia", "LN-12346", "in_service", 12000.0, 7200),
    ("RA-89062", "Boeing", "737-800", "Smartavia", "LN-12347", "maintenance", 18000.2, 10200),
    # Азимут, Sukhoi Superjet 100
    ("RA-89070", "Sukhoi", "Superjet 100", "Азимут", "95001", "in_service", 8000.5, 4500),
    ("RA-89071", "Sukhoi", "Superjet 100", "Азимут", "95002", "in_service", 7500.0, 4200),
    ("RA-89072", "Sukhoi", "Superjet 100", "Азимут", "95003", "in_service", 9200.3, 5100),
    ("RA-89073", "Sukhoi", "Superjet 100", "Азимут", "95004", "in_service", 6800.8, 3800),
    # Якутия: ATR 72-600, Boeing 737-800
    ("RA-89090", "ATR", "72-600", "Якутия", "ATR-001", "in_service", 12000.5, 15000),
    ("RA-89091", "ATR", "72-600", "Якутия", "ATR-002", "in_service", 11000.0, 13800),
    ("RA-89092", "Boeing", "737-800", "Якутия", "LN-89001", "in_service", 20000.0, 11500),
    ("RA-89093", "Boeing", "737-800", "Якутия", "LN-89002", "in_service", 18500.5, 10800),
    # S7, Boeing 737-800
    ("RA-73004", "Boeing", "737-800", "S7 Airlines", "LN-73004", "in_service", 16000.0, 9000),
    ("RA-73005", "Boeing", "737-800", "S7 Airlines", "LN-73005", "in_service", 14000.5, 8200),
    # Аэрофлот: A330-300, 777-300ER
    ("RA-89004", "Airbus", "A330-300", "Аэрофлот - Российские авиалинии", "MSN-89004", "in_service", 25000.0, 8500),
    ("RA-89005", "Airbus", "A330-300", "Аэрофлот - Российские авиалинии", "MSN-89005", "in_service", 23000.5, 7800),
    ("RA-89006", "Boeing", "777-300ER", "Аэрофлот - Российские авиалинии", "LN-89006", "in_service", 30000.0, 6500),
    # Победа, Россия, Уральские
    ("RA-89082", "Boeing", "737-800", "Победа", "LN-89082", "in_service", 13000.0, 7500),
    ("RA-89083", "Boeing", "737-800", "Победа", "LN-89083", "in_service", 11000.5, 6800),
    ("RA-73703", "Boeing", "737-800", "Россия", "LN-73703", "in_service", 17000.0, 9500),
    ("RA-73704", "Boeing", "737-800", "Россия", "LN-73704", "in_service", 15000.5, 8800),
    ("RA-89052", "Airbus", "A320", "Уральские авиалинии", "MSN-89052", "in_service", 19000.0, 10500),
    ("RA-89053", "Airbus", "A320", "Уральские авиалинии", "MSN-89053", "in_service", 17500.5, 9800),
    # Вертолёты (seed_helicopters): Ми-8, Ми-26, Ми-171, Ка-32, Ка-226, Ансат
    ("RA-12345", "Миль", "Ми-8", "Аэрофлот - Российские авиалинии", "08-001", "in_service", 15000.0, 8500),
    ("RA-12346", "Миль", "Ми-8", "S7 Airlines", "08-002", "in_service", 12000.5, 7200),
    ("RA-12347", "Миль", "Ми-8", "Уральские авиалинии", "08-003", "maintenance", 18000.0, 10200),
    ("RA-12348", "Миль", "Ми-8", "Аэрофлот - Российские авиалинии", "08-004", "in_service", 14000.0, 8000),
    ("RA-12349", "Миль", "Ми-8", "S7 Airlines", "08-005", "in_service", 16000.5, 9200),
    ("RA-12450", "Миль", "Ми-26", "Аэрофлот - Российские авиалинии", "26-001", "in_service", 20000.0, 5500),
    ("RA-12451", "Миль", "Ми-26", "Уральские авиалинии", "26-002", "in_service", 18500.5, 5100),
    ("RA-12550", "Миль", "Ми-171", "Аэрофлот - Российские авиалинии", "171-001", "in_service", 8000.0, 4500),
    ("RA-12551", "Миль", "Ми-171", "S7 Airlines", "171-002", "in_service", 7500.5, 4200),
    ("RA-12552", "Миль", "Ми-171", "Уральские авиалинии", "171-003", "in_service", 9200.0, 5100),
    ("RA-12650", "Камов", "Ка-32", "Аэрофлот - Российские авиалинии", "32-001", "in_service", 11000.0, 6500),
    ("RA-12651", "Камов", "Ка-32", "S7 Airlines", "32-002", "maintenance", 13000.5, 7500),
    ("RA-12750", "Камов", "Ка-226", "Аэрофлот - Российские авиалинии", "226-001", "in_service", 5000.0, 3000),
    ("RA-12751", "Камов", "Ка-226", "Уральские авиалинии", "226-002", "in_service", 4500.5, 2800),
    ("RA-12850", "Казанский вертолетный завод", "Ансат", "Аэрофлот - Российские авиалинии", "ANS-001", "in_service", 3000.0, 2000),
    ("RA-12851", "Казанский вертолетный завод", "Ансат", "S7 Airlines", "ANS-002", "in_service", 2800.5, 1900),
    ("RA-12852", "Казанский вертолетный завод", "Ансат", "Уральские авиалинии", "ANS-003", "in_service", 3200.0, 2100),
]


def _get_type_id(db, manufacturer: str, model: str) -> str | None:
    t = db.query(AircraftType).filter(
        AircraftType.manufacturer == manufacturer, AircraftType.model == model
    ).first()
    return str(t.id) if t else None


def _get_operator_id(db, name: str) -> str | None:
    o = db.query(Organization).filter(
        Organization.name == name, Organization.kind == "operator"
    ).first()
    return str(o.id) if o else None


def seed_aircraft_demo():
    db = SessionLocal()
    created = 0
    skipped = 0
    try:
        for reg, manuf, model, op_name, serial, status, t_h, t_c in _AIRCRAFT:
            if db.query(Aircraft).filter(Aircraft.registration_number == reg).first():
                skipped += 1
                continue
            type_id = _get_type_id(db, manuf, model)
            op_id = _get_operator_id(db, op_name)
            if not type_id or not op_id:
                skipped += 1
                continue
            db.add(Aircraft(
                registration_number=reg,
                aircraft_type_id=type_id,
                operator_id=op_id,
                serial_number=serial,
                current_status=status,
                total_time=float(t_h),
                total_cycles=int(t_c),
            ))
            created += 1
        db.commit()
        total = db.query(Aircraft).count()
        print(f"✅ ВС: добавлено {created}, пропущено {skipped}, всего {total}")
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_aircraft_demo()
