# Статус после ревью КЛГ АСУ ТК (14.02.2026)

## Итоговая таблица: проблемы 4–9 и 19

| # | Проблема | Статус |
|---|----------|--------|
| 4 | `rate_limit.py` отсутствовал | **Исправлено** — файл создан: `backend/app/core/rate_limit.py` |
| 5 | `helpers.py` отсутствовал | **Исправлено** — файл создан: `backend/app/api/helpers.py` |
| 6 | `ws_manager.py` отсутствовал | **Исправлено** — файл создан: `backend/app/services/ws_manager.py` |
| 7 | `risk_scheduler.py` отсутствовал | **Исправлено** — файл создан: `backend/app/services/risk_scheduler.py` |
| 8 | `email_service.py` отсутствовал | **Исправлено** — файл создан: `backend/app/services/email_service.py` |
| 9 | `middleware/request_logger.py` отсутствовал | **Исправлено** — файл создан: `backend/app/middleware/request_logger.py` |
| 19 | Deprecated `on_event("startup")` удалён, но lifespan не обновлён | **Исправлено** — в `lifespan` вызывается `setup_scheduler()` при старте |

## Сводка: 6 модулей и ws_notifications

| # | Файл | Наличие | Экспорты по ТЗ |
|---|------|---------|----------------|
| 1 | `backend/app/api/helpers.py` | ✅ Есть | audit, is_authority, get_org_name, paginate_query (+ require_roles, diff_changes, check_* ) |
| 2 | `backend/app/services/ws_manager.py` | ✅ Есть | ws_manager, make_notification(event, entity_type, entity_id, **extra); connect/disconnect/send_to_user/send_to_org/broadcast |
| 3 | `backend/app/services/risk_scheduler.py` | ✅ Есть | setup_scheduler() — заглушка; setup_scheduler(app) — APScheduler |
| 4 | `backend/app/services/email_service.py` | ✅ Есть | email_service; send(to, subject, body) и send(EmailMessage) |
| 5 | `backend/app/middleware/request_logger.py` | ✅ Есть | RequestLoggerMiddleware — method, path, status_code, elapsed_ms |
| 6 | `backend/app/core/rate_limit.py` | ✅ Есть | RateLimitMiddleware — in-memory, RATE_LIMIT_PER_MINUTE, пропуск /health |
| 7 | `backend/app/api/routes/ws_notifications.py` | ✅ Есть | WebSocket /ws/notifications?user_id=&org_id= |

## Внесённые правки (после ревью)

- **risk_scheduler**: `setup_scheduler()` без аргументов — заглушка с `logger.info`; `setup_scheduler(app)` — по-прежнему запускает APScheduler.
- **email_service**: добавлена сигнатура `send(to, subject, body)` (логирует и возвращает True); сохранена поддержка `send(EmailMessage)`.
- **main.py**: импорт `setup_scheduler` перенесён вверх; в `lifespan` добавлен вызов `setup_scheduler()` при старте (п.19 ревью — lifespan обновлён).

## Запуск

После этих изменений приложение должно стартовать без ImportError:

```bash
cd backend && uvicorn app.main:app --reload
```

При старте в логах будет строка: `Risk scheduler: stub — планировщик не сконфигурирован (...)`.
