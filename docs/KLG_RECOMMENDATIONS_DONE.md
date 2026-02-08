# Выполненные рекомендации KLG (8 февраля 2026)

## Выполнено

### ARC-003: Упрощение стека ✅
- docker-compose.yml: только PostgreSQL и Redis
- ENABLE_RISINGWAVE=false, ENABLE_REDPANDA=false в config.py
- Проверки и NotImplementedError в risingwave.py / redpanda.py при отключённых сервисах

### ARC-004: Двойной fetch в Dashboard ✅
- Удалены состояния: directAircraft, directLoading, hasTriedDirectLoad
- Удалён useEffect с прямой загрузкой `/api/aircraft`
- Риски и аудиты переведены на useRisksData / useAuditsData (SWR)
- useMemo упрощён: только aircraftData
- Срок: 1 день

### COD-001: Декомпозиция SettingsModal ✅
- Созданы подкомпоненты в `components/settings/`:
  - GeneralSettings.tsx
  - NotificationSettings.tsx
  - ExportSettings.tsx
  - DisplaySettings.tsx
  - AIAccessSettings.tsx
  - AdvancedSettings.tsx
  - SettingsTabs.tsx
  - types.ts

### COD-002: TypeScript strict mode (шаг 1) ✅
- Создан tsconfig.json с noImplicitAny: true
- strictNullChecks и strictFunctionTypes пока false (постепенное включение)
- Срок: 2–3 дня на каждый шаг

### COD-004: Интеграция inbox в FastAPI ✅
- backend/app/api/routes/inbox.py: /api/v1/inbox/files, /upload, /files/{id}/download, DELETE
- app/inbox/page.tsx — страница Inbox
- app/api/inbox/files/route.ts — API-прокси
- Пункт «Inbox» добавлен в Sidebar

### CORS в inbox-server ✅
- inbox-server использует `process.env.CORS_ORIGIN || "http://localhost:3000"` вместо `*`
- Для production: задать CORS_ORIGIN в .env

### SEC-003: SQL Injection в RisingWave ✅
- backend/app/streaming/risingwave.py: whitelist ALLOWED_VIEWS и _validate_view_name()

## Не выполнено (требует времени)

| ID | Проблема | Причина |
|----|----------|---------|
| ARC-001 | Единая система auth (SSO/OIDC) | 2–3 недели, требуется OIDC-провайдер (Keycloak/ASU TK-IB) |
