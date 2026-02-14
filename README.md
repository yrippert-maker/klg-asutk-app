# КЛГ АСУ ТК — Автоматизированная система управления техническим контролем

> Калининградский филиал — платформа контроля лётной годности, сертификации и безопасности полётов.

## Архитектура v22

```
┌──────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                    │
│  29 pages · 49 components · Tailwind · PWA · i18n        │
├──────────────────────────────────────────────────────────┤
│                  Backend (FastAPI)                        │
│  147+ endpoints · 29 route files · SQLAlchemy · RLS      │
├──────────────────────────────────────────────────────────┤
│                 Infrastructure                           │
│  PostgreSQL · Redis · Keycloak OIDC · Docker · Helm      │
│  Prometheus · Grafana · APScheduler                      │
└──────────────────────────────────────────────────────────┘
```

## Модули системы

| Модуль | Endpoints | Правовая основа |
|--------|-----------|----------------|
| ✈️ Парк ВС | 7 | ВК РФ ст. 33; ФГИС РЭВС |
| 🔧 Контроль ЛГ (AD, SB, LL, MP, Components) | 18 | ВК РФ ст. 36-37.2; ФАП-148; EASA Part-M |
| 📐 Наряды на ТО (Work Orders + CRS) | 10 | ФАП-145 п.A.50-65; EASA Part-145 |
| 🛠️ Дефекты (MEL deferral) | 5 | ФАП-145 п.A.50; EASA Part-M.A.403 |
| 🎓 Персонал ПЛГ (11 программ) | 10 | ФАП-147; EASA Part-66; ICAO Annex 1 |
| 📋 Чек-листы + аудиты | 12 | ВК РФ ст. 28; ICAO Doc 9734 |
| ⚠️ Управление рисками | 3 | ICAO Annex 19; ВК РФ ст. 24.1 |
| 📄 Сертификация эксплуатантов | 9 | ФАП-246; ICAO Annex 6 |
| ⚙️ Модификации ВС | 5 | ФАП-21; EASA Part-21 |
| 🏛️ Панель ФАВТ (read-only) | 9 | ВК РФ ст. 8; ФЗ-152 |
| 📚 Нормативная база | 21 | 19 исходных документов |
| 📊 Dashboard + Analytics | 2 | — |

## Сквозная интеграция

```
ДЛГ (AD) ──→ WO (наряд) ──→ CRS ──→ AD complied
SB ─────────→ WO ──────────→ CRS ──→ SB incorporated
Дефект ─────→ WO ──────────→ CRS ──→ Defect rectified
Life Limit ─→ WO (по остатку) ──→ Component updated
Персонал ───→ scheduler (6ч) ──→ Risk alert
```

## Запуск

```bash
# Development
docker compose --profile base up -d
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd .. && npm install && npm run dev

# Production
docker compose --profile full up -d

# Kubernetes
helm install klg-asutk ./helm/klg-asutk
```

## Правовые основания (19 документов)

### Законодательство РФ
- Воздушный кодекс РФ, 60-ФЗ (ст. 8, 24.1, 28, 33, 35, 36, 37, 37.2, 52-54)
- ФЗ-488 от 30.12.2021 — ст. 37.2 «Поддержание ЛГ»
- ФАП-10/246 · ФАП-21 · ФАП-128 · ФАП-145 · ФАП-147 · ФАП-148 · ФАП-149
- Поручение Президента РФ Пр-1379 · ТЗ АСУ ТК (утв. 24.07.2022)
- ФЗ-152, ФЗ-149

### ICAO
Annex 1, 6, 7, 8, 19 · Doc 9734, 9760, 9859

### EASA
Part-21 · Part-66 · Part-M · Part-CAMO · Part-145 · Part-ARO

## CI/CD

- **`.github/workflows/ci.yml`** — тесты backend (pytest), lint и сборка frontend, сборка Docker-образов при push в `main`.
- **`.github/workflows/security.yml`** — проверки безопасности: `npm audit`, `pip-audit`, Gitleaks (секреты), Dependency Review в PR; запуск при push/PR в `main` и по расписанию (еженедельно).

Подробнее: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Документация

| Документ | Описание |
|----------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Архитектура системы (слои, потоки данных, безопасность) |
| [docs/ops/MONITORING.md](docs/ops/MONITORING.md) | Мониторинг production (Prometheus, health, алертинг, Grafana) |
| [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) | Security-аудит: инструменты и процедуры |
| [docs/SECURITY.md](docs/SECURITY.md) | Правила безопасности и отчёт об уязвимостях |

## Тесты

```bash
cd backend && pytest -v   # 113 tests
npx playwright test       # 16 E2E tests
```

---
© АО «REFLY» — Разработчик АСУ ТК КЛГ
