"""Скрипт для обновления данных вертолетов в базе данных."""
import sys
from pathlib import Path

# Добавляем путь к приложению
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import text
from app.db.session import SessionLocal

def update_helicopters_data():
    """Обновляет данные вертолетов, заполняя недостающие поля."""
    db = SessionLocal()
    try:
        # Получаем ID операторов
        result = db.execute(text("""
            SELECT id, name FROM organizations 
            WHERE kind = 'operator' 
            ORDER BY name
            LIMIT 3
        """))
        operators = result.fetchall()
        
        if not operators:
            print("Не найдены операторы в базе данных")
            return
        
        aeroflot_id = None
        s7_id = None
        ural_id = None
        
        for op_id, op_name in operators:
            if 'Аэрофлот' in op_name:
                aeroflot_id = op_id
            elif 'S7' in op_name or 's7' in op_name.lower():
                s7_id = op_id
            elif 'Уральские' in op_name:
                ural_id = op_id
        
        # Используем первый доступный оператор, если конкретные не найдены
        if not aeroflot_id:
            aeroflot_id = operators[0][0]
        if not s7_id:
            s7_id = operators[1][0] if len(operators) > 1 else operators[0][0]
        if not ural_id:
            ural_id = operators[2][0] if len(operators) > 2 else operators[0][0]
        
        print(f"Используемые операторы: Aeroflot={aeroflot_id}, S7={s7_id}, Ural={ural_id}")
        
        # Обновляем вертолеты
        updates = [
            ('RA-12345', aeroflot_id, '08-001', 15000.0, 8500, 'in_service'),
            ('RA-12346', s7_id, '08-002', 12000.5, 7200, 'in_service'),
            ('RA-12347', ural_id, '08-003', 18000.0, 10200, 'maintenance'),
            ('RA-12348', aeroflot_id, '08-004', 14000.0, 8000, 'in_service'),
            ('RA-12349', s7_id, '08-005', 16000.5, 9200, 'in_service'),
            ('RA-12450', aeroflot_id, '26-001', 20000.0, 5500, 'in_service'),
        ]
        
        for reg_num, op_id, serial, total_time, total_cycles, status in updates:
            db.execute(text("""
                UPDATE aircraft 
                SET 
                    operator_id = COALESCE(operator_id, :op_id),
                    serial_number = COALESCE(serial_number, :serial),
                    total_time = COALESCE(total_time, :total_time),
                    total_cycles = COALESCE(total_cycles, :total_cycles),
                    current_status = COALESCE(current_status, :status)
                WHERE registration_number = :reg_num
            """), {
                'op_id': op_id,
                'serial': serial,
                'total_time': total_time,
                'total_cycles': total_cycles,
                'status': status,
                'reg_num': reg_num
            })
            print(f"Обновлен {reg_num}")
        
        # Обновляем все остальные вертолеты
        db.execute(text("""
            UPDATE aircraft a
            SET 
                operator_id = COALESCE(a.operator_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)),
                serial_number = COALESCE(a.serial_number, 'SN-' || SUBSTRING(a.registration_number, 4)),
                total_time = COALESCE(a.total_time, 10000.0),
                total_cycles = COALESCE(a.total_cycles, 5000),
                current_status = COALESCE(a.current_status, 'in_service')
            WHERE EXISTS (
                SELECT 1 FROM aircraft_types at 
                WHERE at.id = a.aircraft_type_id 
                AND at.manufacturer IN ('Миль', 'Камов', 'Казанский вертолетный завод')
            )
            AND (a.operator_id IS NULL OR a.serial_number IS NULL OR a.total_time IS NULL OR a.total_cycles IS NULL)
        """))
        
        db.commit()
        print("Данные вертолетов успешно обновлены!")
        
        # Проверяем результат
        result = db.execute(text("""
            SELECT 
                a.registration_number,
                o.name as operator_name,
                a.serial_number,
                a.total_time,
                a.total_cycles,
                a.current_status
            FROM aircraft a
            LEFT JOIN organizations o ON o.id = a.operator_id
            WHERE a.registration_number IN ('RA-12345', 'RA-12346', 'RA-12347', 'RA-12348', 'RA-12349', 'RA-12450')
            ORDER BY a.registration_number
        """))
        
        print("\nРезультат обновления:")
        for row in result:
            print(f"  {row[0]}: оператор={row[1]}, серийный={row[2]}, налет={row[3]}, циклы={row[4]}, статус={row[5]}")
            
    except Exception as e:
        db.rollback()
        print(f"Ошибка при обновлении данных: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_helicopters_data()
