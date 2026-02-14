# Changelog — КЛГ АСУ ТК

## v27 (2026-02-13) — ФГИС РЭВС Integration
### Added
- **Интеграция с ФГИС РЭВС** — полная реализация:
  - **Сервис** (629 lines): REST API + СМЭВ 3.0 (SOAP) клиент
    - Модели данных: FGISAircraft, FGISCertificate, FGISOperator, FGISDirective, FGISMaintOrg
    - ГОСТ Р 34.10-2012 (УКЭП) для юридически значимого обмена
    - Mock-данные для тестовой среды (4 ВС, 3 СЛГ, 2 ДЛГ, 1 эксплуатант)
  - **API routes** (313 lines, 15 endpoints):
    - PULL: `/fgis-revs/aircraft`, `/certificates`, `/operators`, `/directives`, `/maintenance-organizations`
    - PUSH: `/push/compliance`, `/push/maintenance`, `/push/defect`
    - SYNC: `/sync/aircraft`, `/sync/certificates`, `/sync/directives`, `/sync/all`
    - STATUS: `/status`, `/config`, `/sync-log`
  - **Frontend** (323 lines, 7 вкладок):
    - Статус подключения (mock/connected/error)
    - Реестр ВС, СЛГ, Директивы ЛГ, Эксплуатанты — DataTable с фильтрами
    - Ручная синхронизация + push compliance/maintenance/defect
    - Журнал синхронизаций
  - **Scheduler**: авто-синхронизация каждые 24ч
    - Pull ВС → Pull СЛГ → Pull ДЛГ
    - Новые mandatory AD → автоматические risk alerts
    - Expired СЛГ → предупреждения
  - **16 тестов**: pull (6), push (3), sync (4), status (3)

### Правовые основания
- ВК РФ ст. 33 (реестр ВС), ст. 36 (СЛГ), ст. 37.2 (поддержание ЛГ)
- Приказ Минтранса № 98 от 02.07.2007
- Приказ Росавиации № 180-П от 09.03.2017
- ФАП-148 п.4.3 (уведомление о выполнении ДЛГ)
- ФАП-145 п.A.55 (документация ТО)
- ФАП-128 (обязательные донесения)

## v26 (2026-02-13) — Final Polish
### Added
- **⌨️ Keyboard shortcuts**: Ctrl+K (search), g→d/a/m/p/c/f/s (navigation), ? (help)
  - ShortcutsHelp overlay с полным списком
- **DataTable v2**: сортировка по столбцам + клиентская пагинация (20 записей/стр)
- **🔔 Notification bell**: real-time WS счётчик, dropdown с последними событиями
- **📍 Breadcrumbs**: автоматическая навигационная цепочка на всех страницах
- **📱 Responsive sidebar**: mobile hamburger toggle (lg: breakpoint)
- **🩺 Health dashboard**: `/health/detailed` — БД, Redis, диск, память, данные
- **Frontend validation**: validate() + RULES для aircraft_reg, P/N, S/N, табельных №
### Metrics
- Полный список горячих клавиш (10 shortcuts)
- DataTable с сортировкой + пагинацией на ВСЕХ таблицах

## v25 (2026-02-13) — Tests, UX, Documentation
### Added
- **15 новых backend тестов** для всех v22-v24 endpoints:
  - test_import_export (3): XLSX export 6 типов + validation
  - test_global_search (4): пустой поиск, min length, поиск AD, поиск персонала
  - test_notification_prefs (2): defaults + update
  - test_wo_integration (6): WO from AD/defect/SB, batch from MP, PDF
- **4 новых E2E теста**: calendar, settings, defects, maintenance
- **👤 Профиль пользователя** — аватар, роль, ID, быстрые ссылки
- **📚 Справка** — вся нормативная база (19 документов) с поиском
  - 4 категории: РФ законодательство, ФАП, ICAO, EASA
- **🌙 Тёмная тема** — toggle в настройках
- **📝 Audit History** — фильтры по типу объекта и действию
### Metrics
- Backend: 130+ BE tests | 20 E2E
- Pages: 34 | Components: 50+
- Endpoints: 160+

## v24 (2026-02-13) — Medium Priority Improvements
### Added
- **📅 Календарь ТО** — визуализация плановых WO, дедлайнов AD, сроков ПК, ресурсов
  - Месячная сетка с цветовой кодировкой типов событий
  - Навигация по месяцам, подсветка текущего дня
- **📊 Import/Export Excel (XLSX)** — массовая загрузка и выгрузка:
  - Экспорт: components, directives, bulletins, specialists, defects, work_orders
  - Импорт: components, specialists, directives (с валидацией)
- **📐 Batch WO из программы ТО** — `POST /work-orders/batch-from-program/{id}`
  - Автоматическое создание нарядов для каждой задачи MP
- **🖨️ Печатная форма CRS** — `/print/crs?wo_id=...` с auto-print
  - Двуязычная (ru/en), ФАП-145 п.A.50 / EASA Part-145.A.50
- **⚙️ Настройки уведомлений** — 9 типов событий × 3 канала (email/push/WS)
  - Toggle-интерфейс, сохранение на бэкенде
- **PWA v2** — улучшенный service worker:
  - Network-first для API (с offline-кешем)
  - Cache-first для статики
  - Offline fallback для всех страниц

## v23 (2026-02-13) — Production Hardening
### Critical Fixes
- **ORM модели**: 10 SQLAlchemy классов для всех новых таблиц (258 lines)
  - PLGSpecialist, PLGAttestation, PLGQualification
  - ADDirective, ServiceBulletin, LifeLimit, MaintenanceProgram, AircraftComponent
  - WorkOrder
- **Global auth**: Depends(get_current_user) на всех 26 роутерах
- **Loading states**: 7 страниц получили индикаторы загрузки

### Added
- **WebSocket notifications** для критических событий:
  - Новая обязательная ДЛГ, критический дефект, AOG наряд, CRS закрытие
  - ConnectionManager с room support (128 lines)
- **Вложения к нарядам/дефектам**: AttachmentUpload компонент
- **Глобальный поиск**: /search/global — ВС, компоненты, AD, SB, WO, дефекты, персонал
  - SearchBar в Sidebar с debounce + dropdown результатов
- **PDF отчёт по WO**: /work-orders/{id}/report/pdf с блоком CRS
- **Dashboard графики**: тренды WO (bar chart), распределение дефектов (progress bars)

## v22 (2026-02-13) — Cross-Module Integration
### Added
- **Сквозная интеграция модулей:**
  - AD → WO (auto-create work order from directive)
  - SB → WO (auto-create from bulletin)
  - Defect → WO (auto-create from defect)
  - All with correct priority mapping (mandatory AD → urgent WO, critical defect → AOG)
- **Dashboard** — добавлены секции WO stats + открытые дефекты + AOG
- **Панель ФАВТ** — endpoint `/regulator/maintenance-summary` (агрегированные данные ТО)
- **Airworthiness** page → навигационный хаб (4 модуля)
- README полностью обновлён с архитектурой v22
### Changed
- Work Orders: 7 → 10 endpoints (+3 интеграционных)
- Regulator: 8 → 9 endpoints

## v21 (2026-02-13) — Work Orders + Refactoring
### Added
- **Наряды на ТО (Work Orders)** — полный lifecycle: draft → in_progress → closed (CRS)
  - 7 endpoints: CRUD + open/close/cancel + stats
  - CRS workflow (Certificate of Release to Service) — ФАП-145 п.A.50
  - Связь с AD, SB, дефектами
  - AOG priority tracking
- DB миграция `007_defects_workorders.sql` (2 таблицы + индексы + RLS)
- 8 новых тестов (5 WO + 3 Defects)
### Changed
- **Dashboard** — интеграция AD, Life Limits, персонала, WO stats
- **5 legacy страниц** переведены на ui/ компоненты (risks, applications, audit-history, inbox, modifications)
- **Дефекты** — frontend с формой регистрации, фильтрами, MEL deferral
### Fixed
- Все страницы теперь используют единую UI библиотеку

## v20 (2026-02-13) — Dashboard Integration + Defects + Alerts
### Added
- **Dashboard переработан** — интеграция AD, Life Limits, персонала ПЛГ, рисков
  - Критические баннеры (открытые ДЛГ, ресурсы, просрочки ПК)
  - 4 секции: Парк ВС, Контроль ЛГ, Персонал ПЛГ, Безопасность
  - Quick links на все модули
- **Дефекты и неисправности** (backend + frontend)
  - 5 endpoints: CRUD + rectify + defer (MEL/CDL)
  - ФАП-145 п.145.A.50; EASA Part-M.A.403
  - Фильтры по статусу, борту, серьёзности
- **Email alert templates** для критических событий
  - Новая обязательная ДЛГ, критический ресурс, просрочка ПК, критический дефект

## v19 (2026-02-13) — Ядро системы ПЛГ (Airworthiness Core)
### Added
- **5 подсистем контроля лётной годности:**
  - Директивы ЛГ (AD/ДЛГ) — регистрация, трекинг выполнения, repetitive ADs
  - Сервисные бюллетени (SB) — категоризация, трудоёмкость, связь с AD
  - Ресурсы и сроки службы (Life Limits) — часы/циклы/календарь, автоматический остаток
  - Программы ТО (Maintenance Programs) — задачи с интервалами, ревизии
  - Карточки компонентов — P/N, S/N, перемещение между ВС, сертификаты
- **18 API endpoints** с audit logging
- **DB миграция** `006_airworthiness_core.sql` (5 таблиц + RLS + индексы)
- **Статус ЛГ конкретного ВС** (`/aircraft-status/{reg}`)
- 10 backend тестов
- Правовые основания: ВК РФ ст. 36-37.2; ФАП-145/148; EASA Part-M; ICAO Annex 6/8

## v17 (2026-02-13) — Сертификация персонала ПЛГ
### Added
- **Модуль «Персонал ПЛГ»** — полный учёт специалистов, аттестация, ПК
  - 11 программ подготовки (PLG-INIT/REC/TYPE + 8 спецкурсов)
  - 13 модулей первичной подготовки (240 ч, соответствие EASA Part-66)
  - Карточка специалиста с историей аттестаций и квалификаций
  - Compliance dashboard (просроченные / истекающие)
  - Экспорт CSV/JSON
- **DB миграция** `005_personnel_plg.sql` (3 таблицы + RLS + индексы)
- **Интеграция с risk_scheduler** — автоматические алерты при просрочке ПК
- **Вкладка «Персонал ПЛГ» в панели ФАВТ** (агрегированные данные)
- 15 backend тестов + 1 E2E
- Правовые основания: ВК РФ ст. 52-54; ФАП-145/147/148; EASA Part-66; ICAO Annex 1

## v15 (2026-02-13) — Панель регулятора ФАВТ
### Added
- **Панель регулятора ФАВТ** — 6 read-only endpoints + 5-tab UI page
  - Сводка, Реестр ВС, Сертификация, Безопасность, Аудиты
  - PDF и JSON экспорт отчётов
  - Правовые основания: ВК РФ, ФАП-246/285, ICAO Annex 6/7/8/19, EASA Part-M/ARO
- Роль `favt_inspector` в Keycloak
- 12 тестов на контроль доступа и защиту данных
- Аудит-логирование всех запросов к /regulator

## v14 — Full Production Stack
### Added
- Universal API proxy (consolidated 23→14 routes)
- Request logging middleware (X-Response-Time)
- Enhanced health check (DB, Redis, Scheduler)
- Data restore endpoint (JSON upload)
- Analytics page (/analytics)
- Auto-migration on startup

## v13 — Dead Code Elimination
### Removed
- 12 dead components (−663 lines)
- 5 dead API routes (−494 lines)
- 7 dead hooks (−625 lines)
- 2 dead services (−100 lines)
### Fixed
- All remaining modals wired into pages
- ErrorBoundary + SkipToMain in layout

## v12 — Zero Inline Styles
### Changed
- **0 inline styles** across entire frontend (was 450+)
- All components converted to Tailwind CSS
### Added
- OIDC JWT verification backend (oidc.py)
- Backup/restore API
- Dark mode toggle in Sidebar
- Activity Timeline, Online Users, Keyboard Help

## v11 — UI Library & Refactoring
### Added
- 9 UI components: PageLayout, DataTable, Modal, FilterBar, StatusBadge, FormField, EmptyState, Pagination, NotificationBell
- Batch operations API
- Email notification service
- OIDC auth hook (frontend)
### Changed
- 14 modals refactored: 4,933→593 lines (−88%)
- Dashboard: 773→180 lines (−77%)

## v10 — Tailwind CSS Migration
### Changed
- 14 pages migrated to Tailwind (−2,108 lines)
- Keycloak OIDC realm configuration
- 8 Playwright E2E smoke tests

## v9 — Monitoring & PWA
### Added
- Prometheus metrics + alerts (5 rules)
- Grafana dashboard (5 panels)
- PWA: manifest, service worker, offline page
- Docker Compose: 3 profiles
- Helm chart for Kubernetes
- Dark mode + i18n (ru/en)

## v1-v8 — Core Platform
### Added
- 12 DRY API routes → 70+ endpoints
- Multi-tenancy RLS (178-line SQL migration)
- Rate limiting, RBAC (6 roles)
- WebSocket realtime notifications
- CI/CD pipeline (.github/workflows)
- Comprehensive audit logging
- Risk scheduler (APScheduler)
- Export API (CSV/JSON, 5 datasets)
