# 🚀 Руководство по развёртыванию КЛГ АСУ ТК v27

## Быстрый старт

### 1. Клонировать и обновить репозиторий

```bash
# Если новый клон
git clone https://github.com/YOUR_ORG/klg-asutk-app.git
cd klg-asutk-app

# Если обновление — распаковать zip поверх
unzip klg-asutk-app-v27-fgis.zip -d /tmp/v27
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' \
  /tmp/v27/ ./

# Закоммитить
git add -A
git commit -m "v27: ФГИС РЭВС integration + production hardening"
git push origin main
```

### 2. Настроить окружение

```bash
cp .env.example .env
nano .env
```

Ключевые переменные:
```env
# База данных
DB_USER=klg
DB_PASSWORD=<strong_password>
DB_NAME=klg

# Безопасность
SECRET_KEY=<random_64_chars>
KC_ADMIN_PASSWORD=<keycloak_password>

# ФГИС РЭВС (для production)
FGIS_API_URL=https://fgis-revs.favt.gov.ru/api/v2
FGIS_ORG_ID=<ваш_id_организации>
FGIS_API_KEY=<api_ключ_фгис>
```

### 3. Запустить

```bash
# Вариант A: Docker (рекомендуется)
make prod

# Вариант B: Вручную
make docker-up       # PostgreSQL + Redis + Keycloak
make install         # Зависимости
make migrate         # Миграции БД
make dev             # Dev-серверы
```

### 4. Проверить

```bash
make health          # Состояние системы
make test            # 164 теста
make fgis-status     # Статус ФГИС РЭВС
```

---

## Обновление существующей установки

### Из GitHub

```bash
git pull origin main
make install         # Обновить зависимости
make migrate         # Новые миграции
make docker-rebuild  # Пересобрать контейнеры
```

### Из ZIP-архива

```bash
# 1. Бэкап
make backup-db

# 2. Распаковать поверх
unzip -o klg-asutk-app-v27-fgis.zip -d .

# 3. Установить новые зависимости
cd backend && pip install openpyxl reportlab psutil --break-system-packages
cd ..

# 4. Применить миграции
make migrate

# 5. Перезапустить
make docker-rebuild
# или для dev:
# Ctrl+C на серверах, затем make dev
```

---

## Структура проекта

```
klg-asutk-app/
├── backend/                    # FastAPI (Python)
│   ├── app/
│   │   ├── api/routes/         # 33 route files, 174 endpoints
│   │   ├── models/             # 20 SQLAlchemy models
│   │   ├── services/           # fgis_revs, ws_manager, email, scheduler
│   │   └── main.py             # Entry point
│   ├── migrations/             # 4 SQL files
│   ├── tests/                  # 144 tests
│   ├── Dockerfile
│   └── requirements.txt
├── app/                        # Next.js pages (35 pages)
├── components/                 # React components (52)
├── hooks/                      # Custom hooks
├── lib/                        # Utilities
├── e2e/                        # Playwright E2E tests (20)
├── public/                     # Static files + PWA
├── docker-compose.yml          # Full stack
├── Makefile                    # All commands
├── Dockerfile                  # Frontend
└── .env.example
```

---

## ФГИС РЭВС: настройка production

### 1. Получить сертификат ГОСТ

```bash
# Разместить файлы:
mkdir -p certs/fgis
cp client.pem certs/fgis/
cp client.key certs/fgis/
cp ca-bundle.pem certs/fgis/
```

### 2. Настроить .env

```env
FGIS_API_URL=https://fgis-revs.favt.gov.ru/api/v2
FGIS_ORG_ID=<id из личного кабинета ФГИС>
FGIS_API_KEY=<ключ API>
```

### 3. Зарегистрироваться в СМЭВ 3.0

Для юридически значимого обмена данными требуется:
- Регистрация в СМЭВ 3.0 (Постановление Правительства РФ № 697)
- УКЭП (усиленная квалифицированная электронная подпись)
- Сертификат ГОСТ Р 34.10-2012

### 4. Включить auto-sync

Auto-sync запускается scheduler-ом каждые 24 часа автоматически.
Для ручного запуска:

```bash
make fgis-sync
```

---

## Команды Makefile

| Команда | Описание |
|---------|----------|
| `make help` | Показать все команды |
| `make dev` | Запуск dev-серверов |
| `make prod` | Production через Docker |
| `make test` | Все тесты (164) |
| `make migrate` | Применить миграции |
| `make health` | Проверка здоровья |
| `make fgis-sync` | Синхронизация ФГИС РЭВС |
| `make fgis-status` | Статус подключения ФГИС |
| `make backup-db` | Бэкап PostgreSQL |
| `make docker-rebuild` | Пересборка контейнеров |
| `make clean` | Очистка кеша |

---

## CI/CD (GitHub Actions)

Workflow `.github/workflows/ci.yml` автоматически:
1. Запускает backend тесты (pytest)
2. Запускает frontend lint
3. Собирает Docker образы
4. (Optional) деплоит на сервер

---

© АО «REFLY» — Разработчик АСУ ТК КЛГ
