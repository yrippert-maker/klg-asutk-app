# Внедрение рекомендаций KLG_TZ_Analysis_Consolidation

## Выполнено (8 февраля 2026)

### 1. next.config.js — rewrites
- `/api/inbox/:path*` → `http://localhost:3001/api/inbox/:path*` (inbox-server)
- `/api/tmc/:path*` → `http://localhost:3001/api/tmc/:path*` (inbox-server)
- `/api/v1/:path*` → `http://localhost:8000/api/v1/:path*` (FastAPI backend)

### 2. inbox-server
- Исправлено: `ORDER BY uploaded_at` → `ORDER BY created_at` (колонка в schema)
- Структура: data/ai-inbox, data/db, prompts/

### 3. prompts/
- `prompts/system.md` — системный промпт для AI-экстракции
- `prompts/policy.md` — политика извлечения
- `prompts/domain/aircraft.md` — домен карточки ВС

### 4. backend/app/core/streaming.py
- ARC-003: no-op при ENABLE_REDPANDA=false и ENABLE_RISINGWAVE=false
- Инициализация только при включённых флагах

### 5. backend/app/core/config.py
- Комментарии для REDPANDA_BROKERS, RISINGWAVE_URL (optional при отключённых сервисах)

### 6. main.py — роутеры
- Подключён `tasks_router` (GET /api/v1/tasks)
- Подключён `audit_router` (GET /api/v1/audit/events, заглушка)

### 7. Реализованные роутеры (16 шт.)
health, organizations, aircraft, cert_applications, attachments, notifications, ingest, airworthiness, modifications, users, legal, risk_alerts, checklists, checklist_audits, inbox, tasks, audit

## Не выполнено (требует внешних ресурсов)

| Пункт | Причина |
|-------|---------|
| Перенос из ~/PAPA/aero-flight-compass-1 | Папка PAPA/aero-flight-compass-1 не найдена |
| supabase/ | Требуется источник |
| Полный inbox-server с extract/apply | Текущий index.js уже содержит API extract, apply, drafts |

## Запуск

```bash
# Terminal 1: Frontend
cd ~/Desktop/klg_asutk_app && npm run dev

# Terminal 2: Backend
cd ~/Desktop/klg_asutk_app/backend && uvicorn app.main:app --reload --port 8000

# Terminal 3: Inbox-server
cd ~/Desktop/klg_asutk_app/inbox-server && node index.js
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Inbox-server: http://localhost:3001
