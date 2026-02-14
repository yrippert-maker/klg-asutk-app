# Архитектура КЛГ АСУ ТК

Документ описывает архитектуру системы контроля лётной годности для крупного проекта (frontend + backend + инфраструктура).

---

## 1. Высокоуровневая схема

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    Пользователи / Браузер                 │
                    └─────────────────────────────┬─────────────────────────────┘
                                                  │ HTTPS
                    ┌─────────────────────────────▼─────────────────────────────┐
                    │  Frontend (Next.js 14)                                     │
                    │  · SSR/CSR · PWA · Tailwind · api-client → Backend        │
                    │  · next-auth / Keycloak OIDC (JWT)                        │
                    └─────────────────────────────┬─────────────────────────────┘
                                                  │ /api/v1/* (proxy или прямой)
                    ┌─────────────────────────────▼─────────────────────────────┐
                    │  Backend (FastAPI)                                         │
                    │  · REST API · RBAC · RLS (multi-tenant) · Prometheus       │
                    └──┬──────────┬──────────┬──────────┬──────────┬────────────┘
                       │          │          │          │          │
         ┌─────────────▼──┐  ┌───▼───┐  ┌──▼──┐  ┌────▼────┐  ┌──▼─────────────┐
         │  PostgreSQL    │  │ Redis │  │MinIO │  │Keycloak │  │ Внешние (ФГИС,  │
         │  (данные, RLS) │  │(кэш)  │  │(S3)  │  │ (OIDC)  │  │ СМЭВ, email)   │
         └────────────────┘  └───────┘  └─────┘  └─────────┘  └────────────────┘
```

---

## 2. Слои системы

### 2.1 Frontend

| Компонент | Технологии | Назначение |
|-----------|------------|------------|
| Фреймворк | Next.js 14, React 18 | SSR, App Router, API routes (proxy) |
| Стили | Tailwind CSS | Единый UI |
| Данные | SWR, единый `lib/api/api-client.ts` | Запросы к Backend с токеном и 401-обработкой |
| Авторизация | next-auth (beta), Keycloak OIDC | JWT в заголовке `Authorization` |
| PWA | Service Worker, manifest | Офлайн-режим, установка на устройство |

- **Страницы:** дашборд, парк ВС, контроль ЛГ (директивы, SB, ресурсы, компоненты), наряды ТО, дефекты, персонал ПЛГ, чек-листы, риски, регулятор, нормативная база, настройки и др.
- **Прокси:** в dev `next.config.js` переписывает `/api/v1/*` на Backend (`BACKEND_URL`).

### 2.2 Backend

| Компонент | Технологии | Назначение |
|-----------|------------|------------|
| API | FastAPI | REST, OpenAPI, зависимости (DB, auth) |
| БД | SQLAlchemy 2, Alembic | Модели, миграции |
| Авторизация | JWT (Keycloak) или DEV-токен | `app.api.deps.get_current_user`, `require_roles` |
| Мультитенантность | PostgreSQL RLS, `set_tenant(db, org_id)` | Изоляция по организации |
| Файлы | MinIO (S3-совместимый) | Вложения, документы |
| Фоновые задачи | APScheduler (risk_scheduler и др.) | Сканирование рисков, уведомления |

- **Роуты:** разбиты по доменам (aircraft, airworthiness_core, work_orders, defects, personnel_plg, legal, fgis_revs, regulator и т.д.).
- **Единая точка БД:** `get_db` из `app.api.deps` (реэкспорт из `app.db.session`), в тестах переопределяется в conftest.

### 2.3 Инфраструктура

| Сервис | Роль |
|--------|------|
| **PostgreSQL** | Основное хранилище, RLS по `app.current_org_id` |
| **Redis** | Кэш, сессии, опционально очереди |
| **MinIO** | Хранилище файлов (S3 API) |
| **Keycloak** | OIDC: выдача JWT, роли, realm `klg` |
| **ФГИС РЭВС** | Внешний API реестра ВС и СЛГ (REST / СМЭВ 3.0) |

---

## 3. Потоки данных

### 3.1 Авторизация

1. Пользователь входит через Keycloak (или в dev — токен `DEV_TOKEN`).
2. Frontend сохраняет JWT (sessionStorage / next-auth) и передаёт в заголовке `Authorization: Bearer <token>`.
3. Backend в `get_current_user` проверяет токен (OIDC или dev), извлекает `organization_id` и роли.
4. Для мультитенантности перед запросами к БД вызывается `set_tenant(db, user.organization_id)` (RLS).

### 3.2 Сквозные сценарии (ЛГ)

- **ДЛГ (AD)** → создание наряда (WO) → выполнение → CRS → статус «выполнено».
- **Дефект** → WO → устранение → CRS.
- **Ресурс (Life Limit)** → контроль остатка → WO при достижении лимита.
- **Персонал ПЛГ** → scheduler проверяет сроки квалификации → risk alert при просрочке.

---

## 4. Безопасность

- **Секреты:** не в коде; `.env` в `.gitignore`, шаблоны `.env.example` и `backend/.env.example`.
- **CORS:** только разрешённые домены из `CORS_ORIGINS`.
- **Авторизация:** в production `ENABLE_DEV_AUTH=false`, только OIDC/JWT.
- **RBAC:** роли admin, authority_inspector, operator_manager, operator_user, mro_*; чувствительные эндпоинты через `require_roles`.
- **SQL:** параметризованные запросы (в т.ч. `set_tenant` через `bindparams`), без конкатенации пользовательского ввода.

---

## 5. Развёртывание

- **Локально:** `docker compose --profile base up -d`, затем backend (uvicorn) и frontend (npm run dev).
- **Production:** `docker compose --profile full` или Kubernetes (Helm chart в `./helm/klg-asutk`).
- **CI/CD:** GitHub Actions — тесты backend, lint и build frontend, сборка образов; отдельный workflow Security (npm audit, pip-audit, gitleaks).

---

## 6. Связанные документы

- [SECURITY.md](SECURITY.md) — правила безопасности и отчёт об уязвимостях.
- [docs/ops/MONITORING.md](ops/MONITORING.md) — мониторинг и алертинг в production.
- [docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md) — проведение security-аудита и внешние инструменты.
- [ANALYSIS_AND_RECOMMENDATIONS.md](ANALYSIS_AND_RECOMMENDATIONS.md) — анализ и рекомендации по коду.

---

© АО «REFLY» — Разработчик АСУ ТК КЛГ
