-- Скрипт для обновления данных вертолетов, чтобы заполнить все поля

DO $$
DECLARE
  -- ID операторов
  aeroflot_id TEXT;
  s7_id TEXT;
  ural_id TEXT;
BEGIN
  -- Получаем ID операторов
  SELECT id INTO aeroflot_id FROM organizations WHERE name = 'Аэрофлот - Российские авиалинии' AND kind = 'operator' LIMIT 1;
  SELECT id INTO s7_id FROM organizations WHERE name = 'S7 Airlines' AND kind = 'operator' LIMIT 1;
  SELECT id INTO ural_id FROM organizations WHERE name = 'Уральские авиалинии' AND kind = 'operator' LIMIT 1;
  
  -- Если операторы не найдены, используем первый доступный оператор
  IF aeroflot_id IS NULL THEN
    SELECT id INTO aeroflot_id FROM organizations WHERE kind = 'operator' LIMIT 1;
  END IF;
  IF s7_id IS NULL THEN
    SELECT id INTO s7_id FROM organizations WHERE kind = 'operator' LIMIT 1;
  END IF;
  IF ural_id IS NULL THEN
    SELECT id INTO ural_id FROM organizations WHERE kind = 'operator' LIMIT 1;
  END IF;
  
  -- Обновляем вертолеты Ми-8
  UPDATE aircraft 
  SET 
    operator_id = COALESCE(operator_id, aeroflot_id),
    serial_number = COALESCE(serial_number, '08-001'),
    total_time = COALESCE(total_time, 15000.0),
    total_cycles = COALESCE(total_cycles, 8500),
    current_status = COALESCE(current_status, 'in_service')
  WHERE registration_number = 'RA-12345';
  
  UPDATE aircraft 
  SET 
    operator_id = COALESCE(operator_id, s7_id),
    serial_number = COALESCE(serial_number, '08-002'),
    total_time = COALESCE(total_time, 12000.5),
    total_cycles = COALESCE(total_cycles, 7200),
    current_status = COALESCE(current_status, 'in_service')
  WHERE registration_number = 'RA-12346';
  
  UPDATE aircraft 
  SET 
    operator_id = COALESCE(operator_id, ural_id),
    serial_number = COALESCE(serial_number, '08-003'),
    total_time = COALESCE(total_time, 18000.0),
    total_cycles = COALESCE(total_cycles, 10200),
    current_status = COALESCE(current_status, 'maintenance')
  WHERE registration_number = 'RA-12347';
  
  UPDATE aircraft 
  SET 
    operator_id = COALESCE(operator_id, aeroflot_id),
    serial_number = COALESCE(serial_number, '08-004'),
    total_time = COALESCE(total_time, 14000.0),
    total_cycles = COALESCE(total_cycles, 8000),
    current_status = COALESCE(current_status, 'in_service')
  WHERE registration_number = 'RA-12348';
  
  UPDATE aircraft 
  SET 
    operator_id = COALESCE(operator_id, s7_id),
    serial_number = COALESCE(serial_number, '08-005'),
    total_time = COALESCE(total_time, 16000.5),
    total_cycles = COALESCE(total_cycles, 9200),
    current_status = COALESCE(current_status, 'in_service')
  WHERE registration_number = 'RA-12349';
  
  -- Обновляем вертолеты Ми-26
  UPDATE aircraft 
  SET 
    operator_id = COALESCE(operator_id, aeroflot_id),
    serial_number = COALESCE(serial_number, '26-001'),
    total_time = COALESCE(total_time, 20000.0),
    total_cycles = COALESCE(total_cycles, 5500),
    current_status = COALESCE(current_status, 'in_service')
  WHERE registration_number = 'RA-12450';
  
  -- Обновляем все остальные вертолеты, у которых отсутствуют данные
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
  AND (a.operator_id IS NULL OR a.serial_number IS NULL OR a.total_time IS NULL OR a.total_cycles IS NULL);
  
END $$;

-- Проверка результата
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
ORDER BY a.registration_number;
