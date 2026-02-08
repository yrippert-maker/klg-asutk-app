-- Скрипт для добавления вертолетов в реестр Российской Федерации

DO $$
DECLARE
  -- ID операторов
  aeroflot_id TEXT;
  s7_id TEXT;
  ural_id TEXT;
  rosaviation_id TEXT;
  
  -- ID типов вертолетов
  mi8_id TEXT;
  mi26_id TEXT;
  ka32_id TEXT;
  ansat_id TEXT;
  mi171_id TEXT;
  ka226_id TEXT;
BEGIN
  -- Получаем ID операторов
  SELECT id INTO aeroflot_id FROM organizations WHERE name = 'Аэрофлот - Российские авиалинии' AND kind = 'operator' LIMIT 1;
  SELECT id INTO s7_id FROM organizations WHERE name = 'S7 Airlines' AND kind = 'operator' LIMIT 1;
  SELECT id INTO ural_id FROM organizations WHERE name = 'Уральские авиалинии' AND kind = 'operator' LIMIT 1;
  SELECT id INTO rosaviation_id FROM organizations WHERE name = 'Федеральное агентство воздушного транспорта (Росавиация)' AND kind = 'authority' LIMIT 1;
  
  -- Добавляем типы вертолетов, если их еще нет
  INSERT INTO aircraft_types (id, manufacturer, model, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'Миль', 'Ми-8', NOW(), NOW()),
    (gen_random_uuid()::text, 'Миль', 'Ми-26', NOW(), NOW()),
    (gen_random_uuid()::text, 'Миль', 'Ми-171', NOW(), NOW()),
    (gen_random_uuid()::text, 'Камов', 'Ка-32', NOW(), NOW()),
    (gen_random_uuid()::text, 'Камов', 'Ка-226', NOW(), NOW()),
    (gen_random_uuid()::text, 'Казанский вертолетный завод', 'Ансат', NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  -- Получаем ID типов вертолетов
  SELECT id INTO mi8_id FROM aircraft_types WHERE manufacturer = 'Миль' AND model = 'Ми-8' LIMIT 1;
  SELECT id INTO mi26_id FROM aircraft_types WHERE manufacturer = 'Миль' AND model = 'Ми-26' LIMIT 1;
  SELECT id INTO mi171_id FROM aircraft_types WHERE manufacturer = 'Миль' AND model = 'Ми-171' LIMIT 1;
  SELECT id INTO ka32_id FROM aircraft_types WHERE manufacturer = 'Камов' AND model = 'Ка-32' LIMIT 1;
  SELECT id INTO ka226_id FROM aircraft_types WHERE manufacturer = 'Камов' AND model = 'Ка-226' LIMIT 1;
  SELECT id INTO ansat_id FROM aircraft_types WHERE manufacturer = 'Казанский вертолетный завод' AND model = 'Ансат' LIMIT 1;
  
  -- Добавляем вертолеты Ми-8
  IF mi8_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-12345', mi8_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '08-001', 'in_service', 15000.0, 8500, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12346', mi8_id, COALESCE(s7_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '08-002', 'in_service', 12000.5, 7200, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12347', mi8_id, COALESCE(ural_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '08-003', 'maintenance', 18000.0, 10200, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12348', mi8_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '08-004', 'in_service', 14000.0, 8000, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12349', mi8_id, COALESCE(s7_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '08-005', 'in_service', 16000.5, 9200, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Добавляем вертолеты Ми-26
  IF mi26_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-12450', mi26_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '26-001', 'in_service', 20000.0, 5500, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12451', mi26_id, COALESCE(ural_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '26-002', 'in_service', 18500.5, 5100, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Добавляем вертолеты Ми-171
  IF mi171_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-12550', mi171_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '171-001', 'in_service', 8000.0, 4500, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12551', mi171_id, COALESCE(s7_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '171-002', 'in_service', 7500.5, 4200, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12552', mi171_id, COALESCE(ural_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '171-003', 'in_service', 9200.0, 5100, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Добавляем вертолеты Ка-32
  IF ka32_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-12650', ka32_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '32-001', 'in_service', 11000.0, 6500, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12651', ka32_id, COALESCE(s7_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '32-002', 'maintenance', 13000.5, 7500, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Добавляем вертолеты Ка-226
  IF ka226_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-12750', ka226_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '226-001', 'in_service', 5000.0, 3000, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12751', ka226_id, COALESCE(ural_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), '226-002', 'in_service', 4500.5, 2800, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Добавляем вертолеты Ансат
  IF ansat_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-12850', ansat_id, COALESCE(aeroflot_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), 'ANS-001', 'in_service', 3000.0, 2000, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12851', ansat_id, COALESCE(s7_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), 'ANS-002', 'in_service', 2800.5, 1900, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-12852', ansat_id, COALESCE(ural_id, (SELECT id FROM organizations WHERE kind = 'operator' LIMIT 1)), 'ANS-003', 'in_service', 3200.0, 2100, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
END $$;

-- Проверка результата
SELECT 
  at.manufacturer || ' ' || at.model as helicopter_type,
  COUNT(a.id) as count,
  STRING_AGG(a.registration_number, ', ' ORDER BY a.registration_number) as registration_numbers
FROM aircraft_types at
JOIN aircraft a ON a.aircraft_type_id = at.id
WHERE at.manufacturer IN ('Миль', 'Камов', 'Казанский вертолетный завод')
GROUP BY at.id, at.manufacturer, at.model
ORDER BY at.manufacturer, at.model;

-- Общая статистика
SELECT 
  'Всего вертолетов в реестре' as info,
  COUNT(*) as count
FROM aircraft a
JOIN aircraft_types at ON a.aircraft_type_id = at.id
WHERE at.manufacturer IN ('Миль', 'Камов', 'Казанский вертолетный завод');
