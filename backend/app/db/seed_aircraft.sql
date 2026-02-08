-- Скрипт для заполнения воздушных судов для всех операторов

-- Добавляем воздушные суда для операторов, у которых их еще нет

DO $$
DECLARE
  -- ID операторов
  smartavia_id TEXT;
  azimuth_id TEXT;
  yakutia_id TEXT;
  
  -- ID типов ВС (используем популярные типы)
  boeing737_id TEXT;
  airbus320_id TEXT;
  sukhoi_superjet_id TEXT;
  boeing777_id TEXT;
  airbus330_id TEXT;
  atr72_id TEXT;
BEGIN
  -- Получаем ID операторов
  SELECT id INTO smartavia_id FROM organizations WHERE name = 'Smartavia' AND kind = 'operator' LIMIT 1;
  SELECT id INTO azimuth_id FROM organizations WHERE name = 'Азимут' AND kind = 'operator' LIMIT 1;
  SELECT id INTO yakutia_id FROM organizations WHERE name = 'Якутия' AND kind = 'operator' LIMIT 1;
  
  -- Получаем ID типов ВС
  SELECT id INTO boeing737_id FROM aircraft_types WHERE manufacturer = 'Boeing' AND model = '737-800' LIMIT 1;
  SELECT id INTO airbus320_id FROM aircraft_types WHERE manufacturer = 'Airbus' AND model = 'A320' LIMIT 1;
  SELECT id INTO sukhoi_superjet_id FROM aircraft_types WHERE manufacturer = 'Sukhoi' AND model = 'Superjet 100' LIMIT 1;
  SELECT id INTO boeing777_id FROM aircraft_types WHERE manufacturer = 'Boeing' AND model = '777-300ER' LIMIT 1;
  SELECT id INTO airbus330_id FROM aircraft_types WHERE manufacturer = 'Airbus' AND model = 'A330-300' LIMIT 1;
  SELECT id INTO atr72_id FROM aircraft_types WHERE manufacturer = 'ATR' AND model = '72-600' LIMIT 1;
  
  -- Если типов ВС нет, используем первый доступный тип
  IF boeing737_id IS NULL THEN
    SELECT id INTO boeing737_id FROM aircraft_types LIMIT 1;
  END IF;
  IF airbus320_id IS NULL THEN
    SELECT id INTO airbus320_id FROM aircraft_types LIMIT 1;
  END IF;
  IF sukhoi_superjet_id IS NULL THEN
    SELECT id INTO sukhoi_superjet_id FROM aircraft_types LIMIT 1;
  END IF;
  
  -- Smartavia - добавляем Boeing 737
  IF smartavia_id IS NOT NULL AND boeing737_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-89060', boeing737_id, smartavia_id, 'LN-12345', 'in_service', 15000.5, 8500, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-89061', boeing737_id, smartavia_id, 'LN-12346', 'in_service', 12000.0, 7200, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-89062', boeing737_id, smartavia_id, 'LN-12347', 'maintenance', 18000.2, 10200, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Азимут - добавляем Sukhoi Superjet 100
  IF azimuth_id IS NOT NULL AND sukhoi_superjet_id IS NOT NULL THEN
    INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
    VALUES
      (gen_random_uuid()::text, 'RA-89070', sukhoi_superjet_id, azimuth_id, '95001', 'in_service', 8000.5, 4500, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-89071', sukhoi_superjet_id, azimuth_id, '95002', 'in_service', 7500.0, 4200, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-89072', sukhoi_superjet_id, azimuth_id, '95003', 'in_service', 9200.3, 5100, NOW(), NOW()),
      (gen_random_uuid()::text, 'RA-89073', sukhoi_superjet_id, azimuth_id, '95004', 'in_service', 6800.8, 3800, NOW(), NOW())
    ON CONFLICT (registration_number) DO NOTHING;
  END IF;
  
  -- Якутия - добавляем ATR 72 и Boeing 737
  IF yakutia_id IS NOT NULL THEN
    IF atr72_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-89090', atr72_id, yakutia_id, 'ATR-001', 'in_service', 12000.5, 15000, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-89091', atr72_id, yakutia_id, 'ATR-002', 'in_service', 11000.0, 13800, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
    
    IF boeing737_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-89092', boeing737_id, yakutia_id, 'LN-89001', 'in_service', 20000.0, 11500, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-89093', boeing737_id, yakutia_id, 'LN-89002', 'in_service', 18500.5, 10800, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
  END IF;
  
  -- Также добавляем дополнительные ВС для операторов, у которых их мало
  -- S7 Airlines - добавляем еще несколько
  IF EXISTS (SELECT 1 FROM organizations WHERE name = 'S7 Airlines' AND kind = 'operator') THEN
    SELECT id INTO smartavia_id FROM organizations WHERE name = 'S7 Airlines' AND kind = 'operator' LIMIT 1;
    IF boeing737_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-73004', boeing737_id, smartavia_id, 'LN-73004', 'in_service', 16000.0, 9000, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-73005', boeing737_id, smartavia_id, 'LN-73005', 'in_service', 14000.5, 8200, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
  END IF;
  
  -- Аэрофлот - добавляем еще несколько
  IF EXISTS (SELECT 1 FROM organizations WHERE name = 'Аэрофлот - Российские авиалинии' AND kind = 'operator') THEN
    SELECT id INTO smartavia_id FROM organizations WHERE name = 'Аэрофлот - Российские авиалинии' AND kind = 'operator' LIMIT 1;
    IF airbus330_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-89004', airbus330_id, smartavia_id, 'MSN-89004', 'in_service', 25000.0, 8500, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-89005', airbus330_id, smartavia_id, 'MSN-89005', 'in_service', 23000.5, 7800, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
    
    IF boeing777_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-89006', boeing777_id, smartavia_id, 'LN-89006', 'in_service', 30000.0, 6500, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
  END IF;
  
  -- Победа - добавляем еще несколько
  IF EXISTS (SELECT 1 FROM organizations WHERE name = 'Победа' AND kind = 'operator') THEN
    SELECT id INTO smartavia_id FROM organizations WHERE name = 'Победа' AND kind = 'operator' LIMIT 1;
    IF boeing737_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-89082', boeing737_id, smartavia_id, 'LN-89082', 'in_service', 13000.0, 7500, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-89083', boeing737_id, smartavia_id, 'LN-89083', 'in_service', 11000.5, 6800, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
  END IF;
  
  -- Россия - добавляем еще несколько
  IF EXISTS (SELECT 1 FROM organizations WHERE name = 'Россия' AND kind = 'operator') THEN
    SELECT id INTO smartavia_id FROM organizations WHERE name = 'Россия' AND kind = 'operator' LIMIT 1;
    IF boeing737_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-73703', boeing737_id, smartavia_id, 'LN-73703', 'in_service', 17000.0, 9500, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-73704', boeing737_id, smartavia_id, 'LN-73704', 'in_service', 15000.5, 8800, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
  END IF;
  
  -- Уральские авиалинии - добавляем еще несколько
  IF EXISTS (SELECT 1 FROM organizations WHERE name = 'Уральские авиалинии' AND kind = 'operator') THEN
    SELECT id INTO smartavia_id FROM organizations WHERE name = 'Уральские авиалинии' AND kind = 'operator' LIMIT 1;
    IF airbus320_id IS NOT NULL THEN
      INSERT INTO aircraft (id, registration_number, aircraft_type_id, operator_id, serial_number, current_status, total_time, total_cycles, created_at, updated_at)
      VALUES
        (gen_random_uuid()::text, 'RA-89052', airbus320_id, smartavia_id, 'MSN-89052', 'in_service', 19000.0, 10500, NOW(), NOW()),
        (gen_random_uuid()::text, 'RA-89053', airbus320_id, smartavia_id, 'MSN-89053', 'in_service', 17500.5, 9800, NOW(), NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    END IF;
  END IF;
  
END $$;

-- Проверка результата
SELECT 
  o.name as operator_name,
  COUNT(a.id) as aircraft_count
FROM organizations o
LEFT JOIN aircraft a ON a.operator_id = o.id
WHERE o.kind = 'operator'
GROUP BY o.id, o.name
ORDER BY o.name;
