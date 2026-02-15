# Заключение: Demo-инфраструктура КЛГ АСУ ТК

**Дата:** 15 февраля 2026  
**Задача:** Подготовка к подключению до 5 удалённых клиентов для демонстрации, тестирования и проверки работоспособности

---

## Сводка: все 9 блоков реализованы

| # | Блок | Файлы | Статус |
|---|------|-------|--------|
| 1 | Dockerfile frontend | `Dockerfile` (корень) — multi-stage builder + runner | ✅ |
| 2 | Docker Compose demo | `docker-compose.demo.yml` — Caddy, seed, env override | ✅ |
| 3 | Reverse proxy | `demo/Caddyfile` — авто-HTTPS, проксирование, безопасность | ✅ |
| 4 | 5 пользователей + токены | `demo/users.json`, `demo/generate_tokens.py` | ✅ |
| 5 | Demo seed | `backend/app/demo/seed.py` — адаптирован под модели | ✅ |
| 6 | Скрипт развёртывания | `demo/deploy.sh` — one-command deploy | ✅ |
| 7 | Документация | `docs/DEMO.md` — 3 варианта хостинга, сценарии | ✅ |
| 8 | .gitignore | `demo/tokens.json` добавлен | ✅ |
| 9 | Адаптация seed под модели | Organization.kind, AircraftType без name, Aircraft без flight_hours, 5 User | ✅ |

---

## Архитектура demo-стенда

```
Удалённый клиент (браузер)
    │ HTTPS / WSS
    ▼
┌─────────────────────────────┐
│  Caddy (порты 80/443)       │ ← авто-сертификат Let's Encrypt
│  reverse proxy + TLS        │
├─────────────────────────────┤
│  /          → frontend:3000 │ Next.js (SSR)
│  /api/*     → backend:8000  │ FastAPI (4 workers)
│  /ws/*      → backend:8000  │ WebSocket
│  /docs      → backend:8000  │ Swagger UI
│  /auth/*    → keycloak:8080 │ (опционально)
└─────────────────────────────┘
         │              │
    ┌────┘              └────┐
    ▼                        ▼
┌──────────┐          ┌──────────┐
│ PostgreSQL│          │  Redis   │
│  + RLS    │          │  cache   │
└──────────┘          └──────────┘
    ▲
    │
┌──────────────┐
│ Keycloak DB  │ (отдельная БД)
│ (опционально)│
└──────────────┘
```

## 5 тестовых пользователей

| # | Имя | Роль | Организация | Ключевые возможности |
|---|-----|------|-------------|---------------------|
| 1 | Админ Системы | `admin` | — | Полный доступ, dashboard, аналитика |
| 2 | Иванов И.П. | `authority_inspector` | ФАВТ | Инспекция, одобрение заявок, аудиты, панель ФАВТ |
| 3 | Петров А.С. | `operator_manager` | КалинингрАвиа | Парк ВС (4 борта), заявки, модификации |
| 4 | Сидоров В.Н. | `mro_manager` | Балтик Техник | Наряды ТО, чек-листы, CRS, дефекты |
| 5 | Козлова Е.А. | `operator_user` | КалинингрАвиа | Просмотр ВС, создание заявок |

## Демо-данные (seed)

- **3 организации:** АК «КалинингрАвиа», ТОиР «Балтик Техник», МТУ ФАВТ Северо-Запад
- **3 типа ВС:** SSJ100, МС-21-300, L-410
- **4 воздушных судна:** RA-89001, RA-89002, RA-73001, RA-67001
- **2 заявки:** одна submitted (ТОиР по ФАП-145), одна draft (продление СЭ)
- **2 уведомления:** новая заявка для инспектора, приближающаяся инспекция для оператора

## Два режима авторизации

### Режим 1: Dev-токены (по умолчанию)
```bash
bash demo/deploy.sh --domain demo.klg.refly.ru
# Генерирует JWT HS256 токены на 30 дней для каждого пользователя
# Токены сохраняются в demo/tokens.json
```

### Режим 2: Keycloak OIDC
```bash
bash demo/deploy.sh --domain demo.klg.refly.ru --with-keycloak
# Поднимает Keycloak на отдельной БД
# Доступ: https://demo.klg.refly.ru/auth
```

## Три варианта хостинга

| Вариант | Подходит для | Стоимость | Сложность |
|---------|-------------|-----------|-----------|
| **VPS/VDS** (Timeweb, Selectel, Hetzner) | Постоянный demo-стенд | от 500₽/мес | Низкая |
| **Локальный + Cloudflare Tunnel** | Быстрая демонстрация | Бесплатно | Минимальная |
| **Yandex Cloud / Selectel Cloud** | Масштабирование, SLA | от 2000₽/мес | Средняя |

**Минимальные требования:** 2 vCPU, 4 GB RAM, 10 GB SSD, Docker 24+

## Команды управления

```bash
# Запуск
bash demo/deploy.sh [--domain DOMAIN] [--with-keycloak]

# Генерация токенов (повторно)
python3 demo/generate_tokens.py --format table

# Логи
docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo logs -f

# Остановка
docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo down

# Полный сброс (с удалением данных)
docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo down -v
```

---

## Рекомендации перед запуском demo

1. **Проверить seed.py** — убедиться что все модели совпадают с текущими миграциями (поля Organization.kind, AircraftType, Aircraft). При ошибках seed логирует и завершается с ненулевым кодом.

2. **Frontend login-страница** — страница `/login` уже поддерживает ввод токена (поле «Токен доступа»), вызывает `login(token)` из auth-context, который сохраняет токен через `setAuthToken()` из `api-client.ts`. Для demo подставьте токен из `demo/tokens.json`.

3. **CORS** — при использовании домена добавить его в `CORS_ORIGINS` в `.env` (deploy.sh делает это автоматически при создании .env).

4. **Firewall** — на VPS открыть порты 80 и 443 для Caddy.

5. **WebSocket** — проверить что `wss://` проходит через Caddy (Caddyfile уже настроен на `/ws/*`).
