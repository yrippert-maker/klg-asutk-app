-- Скрипт для заполнения всех справочников системы

-- 1. ОРГАНИЗАЦИИ
-- Операторы (авиакомпании)
INSERT INTO organizations (id, kind, name, inn, ogrn, address, email, phone, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'operator', 'Аэрофлот - Российские авиалинии', '7702070139', '1027739036681', 'г. Москва, ул. Ленинградский проспект, д. 37, корп. 2', 'info@aeroflot.ru', '+7 (495) 223-55-55', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'S7 Airlines', '5405013127', '1025400000037', 'г. Новосибирск, ул. Добролюбова, д. 2', 'info@s7.ru', '+7 (495) 777-77-77', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'Уральские авиалинии', '6658004767', '1026600000040', 'г. Екатеринбург, ул. Сакко и Ванцетти, д. 105', 'info@uralairlines.ru', '+7 (343) 264-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'Победа', '7702070139', '1157746263102', 'г. Москва, ул. Ленинградский проспект, д. 37, корп. 2', 'info@pobeda.aero', '+7 (495) 363-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'Россия', '4703008763', '1024700000040', 'г. Санкт-Петербург, ул. Пилотов, д. 18', 'info@rossiya-airlines.com', '+7 (812) 333-22-11', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'Якутия', '1435027000', '1021400000040', 'г. Якутск, ул. Октябрьская, д. 9', 'info@yakutia.aero', '+7 (4112) 44-11-11', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'Азимут', '2315086352', '1162315077000', 'г. Ростов-на-Дону, пр-т Шолохова, д. 344', 'info@azimuth.aero', '+7 (863) 206-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'operator', 'Smartavia', '2901000000', '1022900000040', 'г. Архангельск, ул. Воскресенская, д. 77', 'info@smartavia.ru', '+7 (8182) 65-00-00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- MRO (организации технического обслуживания)
INSERT INTO organizations (id, kind, name, inn, ogrn, address, email, phone, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Шереметьево', '7712048351', '1027700000040', 'г. Москва, аэропорт Шереметьево', 'info@atc-svo.ru', '+7 (495) 578-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Домодедово', '5007004767', '1025000000040', 'г. Москва, аэропорт Домодедово', 'info@atc-dme.ru', '+7 (495) 933-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Пулково', '7802000000', '1027800000040', 'г. Санкт-Петербург, аэропорт Пулково', 'info@atc-led.ru', '+7 (812) 337-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Толмачево', '5405013127', '1025400000037', 'г. Новосибирск, аэропорт Толмачево', 'info@atc-ovb.ru', '+7 (383) 216-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Кольцово', '6658004767', '1026600000040', 'г. Екатеринбург, аэропорт Кольцово', 'info@atc-svk.ru', '+7 (343) 264-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Ростов-на-Дону', '6163000000', '1026100000040', 'г. Ростов-на-Дону, аэропорт Платов', 'info@atc-rov.ru', '+7 (863) 206-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Краснодар', '2308000000', '1022300000040', 'г. Краснодар, аэропорт Пашковский', 'info@atc-krr.ru', '+7 (861) 200-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'mro', 'Авиационный технический центр Сочи', '2308000000', '1022300000040', 'г. Сочи, аэропорт Сочи', 'info@atc-aer.ru', '+7 (862) 240-00-00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Органы сертификации (authority)
INSERT INTO organizations (id, kind, name, inn, ogrn, address, email, phone, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'authority', 'Федеральное агентство воздушного транспорта (Росавиация)', '7702070139', '1047796000000', 'г. Москва, ул. Шаболовка, д. 4', 'info@favt.gov.ru', '+7 (495) 607-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'authority', 'Межгосударственный авиационный комитет (МАК)', '7702070139', '1027700000040', 'г. Москва, ул. Большая Ордынка, д. 22/2', 'info@mak-iac.org', '+7 (495) 607-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'authority', 'Европейское агентство по авиационной безопасности (EASA)', NULL, NULL, 'Konrad-Adenauer-Ufer 3, 50668 Köln, Germany', 'info@easa.europa.eu', '+49 221 8999 000', NOW(), NOW()),
  (gen_random_uuid()::text, 'authority', 'Федеральное управление гражданской авиации США (FAA)', NULL, NULL, '800 Independence Avenue SW, Washington, DC 20591, USA', 'info@faa.gov', '+1 (202) 267-1000', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Другие организации
INSERT INTO organizations (id, kind, name, inn, ogrn, address, email, phone, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'other', 'ОАК (Объединенная авиастроительная корпорация)', '7702070139', '1067746000000', 'г. Москва, ул. Большая Дмитровка, д. 26/1', 'info@uacrussia.ru', '+7 (495) 926-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'other', 'Иркут (ПАО Корпорация Иркут)', '3808000000', '1023800000040', 'г. Иркутск, ул. Новаторов, д. 3', 'info@irkut.com', '+7 (3952) 39-00-00', NOW(), NOW()),
  (gen_random_uuid()::text, 'other', 'Сухой (ПАО Компания Сухой)', '7702070139', '1027700000040', 'г. Москва, ул. Поликарпова, д. 23А', 'info@sukhoi.org', '+7 (495) 926-00-00', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 2. ПОЛЬЗОВАТЕЛИ
-- Сначала получим ID организаций для привязки пользователей
DO $$
DECLARE
  aeroflot_id TEXT;
  s7_id TEXT;
  ural_id TEXT;
  atc_svo_id TEXT;
  atc_dme_id TEXT;
  rosaviation_id TEXT;
BEGIN
  -- Получаем ID организаций
  SELECT id INTO aeroflot_id FROM organizations WHERE name = 'Аэрофлот - Российские авиалинии' LIMIT 1;
  SELECT id INTO s7_id FROM organizations WHERE name = 'S7 Airlines' LIMIT 1;
  SELECT id INTO ural_id FROM organizations WHERE name = 'Уральские авиалинии' LIMIT 1;
  SELECT id INTO atc_svo_id FROM organizations WHERE name = 'Авиационный технический центр Шереметьево' LIMIT 1;
  SELECT id INTO atc_dme_id FROM organizations WHERE name = 'Авиационный технический центр Домодедово' LIMIT 1;
  SELECT id INTO rosaviation_id FROM organizations WHERE name = 'Федеральное агентство воздушного транспорта (Росавиация)' LIMIT 1;

  -- Администраторы
  INSERT INTO users (id, external_subject, display_name, email, role, organization_id, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'admin@system', 'Администратор системы', 'admin@klg.local', 'admin', NULL, NOW(), NOW()),
    (gen_random_uuid()::text, 'admin@rosaviation', 'Администратор Росавиации', 'admin@favt.gov.ru', 'admin', rosaviation_id, NOW(), NOW())
  ON CONFLICT (external_subject) DO NOTHING;

  -- Инспекторы органов сертификации
  INSERT INTO users (id, external_subject, display_name, email, role, organization_id, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'inspector1@rosaviation', 'Иванов Иван Иванович', 'i.ivanov@favt.gov.ru', 'authority_inspector', rosaviation_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'inspector2@rosaviation', 'Петров Петр Петрович', 'p.petrov@favt.gov.ru', 'authority_inspector', rosaviation_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'inspector3@rosaviation', 'Сидоров Сидор Сидорович', 's.sidorov@favt.gov.ru', 'authority_inspector', rosaviation_id, NOW(), NOW())
  ON CONFLICT (external_subject) DO NOTHING;

  -- Менеджеры операторов
  INSERT INTO users (id, external_subject, display_name, email, role, organization_id, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'manager1@aeroflot', 'Смирнов Алексей Владимирович', 'a.smirnov@aeroflot.ru', 'operator_manager', aeroflot_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'manager2@s7', 'Козлов Дмитрий Сергеевич', 'd.kozlov@s7.ru', 'operator_manager', s7_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'manager3@ural', 'Новиков Андрей Николаевич', 'a.novikov@uralairlines.ru', 'operator_manager', ural_id, NOW(), NOW())
  ON CONFLICT (external_subject) DO NOTHING;

  -- Пользователи операторов
  INSERT INTO users (id, external_subject, display_name, email, role, organization_id, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'user1@aeroflot', 'Волков Сергей Александрович', 's.volkov@aeroflot.ru', 'operator_user', aeroflot_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'user2@aeroflot', 'Лебедев Михаил Игоревич', 'm.lebedev@aeroflot.ru', 'operator_user', aeroflot_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'user1@s7', 'Соколов Павел Викторович', 'p.sokolov@s7.ru', 'operator_user', s7_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'user1@ural', 'Михайлов Игорь Олегович', 'i.mikhailov@uralairlines.ru', 'operator_user', ural_id, NOW(), NOW())
  ON CONFLICT (external_subject) DO NOTHING;

  -- Менеджеры MRO
  INSERT INTO users (id, external_subject, display_name, email, role, organization_id, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'manager1@atc-svo', 'Федоров Владимир Петрович', 'v.fedorov@atc-svo.ru', 'mro_manager', atc_svo_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'manager2@atc-dme', 'Морозов Николай Анатольевич', 'n.morozov@atc-dme.ru', 'mro_manager', atc_dme_id, NOW(), NOW())
  ON CONFLICT (external_subject) DO NOTHING;

  -- Пользователи MRO
  INSERT INTO users (id, external_subject, display_name, email, role, organization_id, created_at, updated_at)
  VALUES
    (gen_random_uuid()::text, 'user1@atc-svo', 'Алексеев Олег Дмитриевич', 'o.alekseev@atc-svo.ru', 'mro_user', atc_svo_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'user2@atc-svo', 'Павлов Роман Сергеевич', 'r.pavlov@atc-svo.ru', 'mro_user', atc_svo_id, NOW(), NOW()),
    (gen_random_uuid()::text, 'user1@atc-dme', 'Семенов Артем Валерьевич', 'a.semenov@atc-dme.ru', 'mro_user', atc_dme_id, NOW(), NOW())
  ON CONFLICT (external_subject) DO NOTHING;
END $$;

-- Итоговая статистика
SELECT 'Справочники заполнены' as result;
SELECT 'Организации:' as info, COUNT(*) as count FROM organizations;
SELECT 'Пользователи:' as info, COUNT(*) as count FROM users;
SELECT 'Типы ВС:' as info, COUNT(*) as count FROM aircraft_types;
