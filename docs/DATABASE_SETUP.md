# Настройка базы данных и Redis

## Содержание
1. [Установка PostgreSQL](#установка-postgresql)
2. [Настройка PostgreSQL](#настройка-postgresql)
3. [Установка Redis](#установка-redis)
4. [Настройка Redis](#настройка-redis)
5. [Конфигурация приложения](#конфигурация-приложения)
6. [Инициализация базы данных](#инициализация-базы-данных)
7. [Проверка подключения](#проверка-подключения)

---

## Установка PostgreSQL

### macOS (через Homebrew)
```bash
# Установка PostgreSQL
brew install postgresql@15

# Запуск PostgreSQL
brew services start postgresql@15

# Проверка статуса
brew services list
```

### Linux (Ubuntu/Debian)
```bash
# Обновление пакетов
sudo apt update

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib

# Запуск службы
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
1. Скачайте установщик с [официального сайта PostgreSQL](https://www.postgresql.org/download/windows/)
2. Запустите установщик и следуйте инструкциям
3. Запомните пароль для пользователя `postgres`

---

## Настройка PostgreSQL

### 1. Создание базы данных

```bash
# Подключение к PostgreSQL
psql postgres

# Создание базы данных
CREATE DATABASE klg_db;

# Создание пользователя (если нужно)
CREATE USER klg_user WITH PASSWORD 'your_secure_password';

# Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE klg_db TO klg_user;

# Выход
\q
```

### 2. Альтернативный способ (через командную строку)

```bash
# Создание базы данных
createdb klg_db

# Или с указанием пользователя
createdb -U postgres klg_db
```

---

## Установка Redis

### macOS (через Homebrew)
```bash
# Установка Redis
brew install redis

# Запуск Redis
brew services start redis

# Проверка статуса
brew services list

# Проверка работы
redis-cli ping
# Должно вернуть: PONG
```

### Linux (Ubuntu/Debian)
```bash
# Установка Redis
sudo apt install redis-server

# Запуск службы
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Проверка работы
redis-cli ping
```

### Windows
1. Скачайте Redis для Windows с [GitHub](https://github.com/microsoftarchive/redis/releases)
2. Или используйте WSL (Windows Subsystem for Linux)
3. Или используйте Docker (см. раздел Docker ниже)

---

## Настройка Redis

### Базовые настройки (опционально)

Редактируйте файл конфигурации Redis:

**macOS/Linux:** `/usr/local/etc/redis.conf` или `/etc/redis/redis.conf`

```conf
# Максимальный объем памяти (например, 256MB)
maxmemory 256mb
maxmemory-policy allkeys-lru

# Пароль (опционально, но рекомендуется)
requirepass your_redis_password
```

После изменения конфигурации перезапустите Redis:
```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis-server
```

---

## Конфигурация приложения

### 1. Обновите файл `.env.local`

Создайте или обновите файл `.env.local` в корне проекта:

```env
# PostgreSQL настройки
DB_HOST=localhost
DB_PORT=5432
DB_NAME=klg_db
DB_USER=postgres
# Или используйте созданного пользователя:
# DB_USER=klg_user
DB_PASSWORD=your_postgres_password
DB_POOL_MAX=20

# Redis настройки
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# Если вы установили пароль для Redis, укажите его:
# REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Включение Redis (опционально)
REDIS_ENABLED=true

# OpenAI API (для ИИ агента)
OPENAI_API_KEY=your_openai_api_key

# Sentry (опционально, для мониторинга ошибок)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
```

### 2. Безопасность

**ВАЖНО:** Файл `.env.local` уже добавлен в `.gitignore` и не будет загружен в репозиторий.

---

## Инициализация базы данных

### 1. Создание схемы базы данных

```bash
# Подключение к базе данных
psql -U postgres -d klg_db

# Выполнение SQL скрипта
\i lib/database/schema.sql

# Или через командную строку
psql -U postgres -d klg_db -f lib/database/schema.sql
```

### 2. Альтернативный способ (через Node.js скрипт)

Создайте файл `scripts/init-database.ts`:

```typescript
import { pool } from '../lib/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initDatabase() {
  try {
    const schema = readFileSync(join(__dirname, '../lib/database/schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✅ База данных успешно инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
```

Запустите скрипт:
```bash
npx tsx scripts/init-database.ts
```

---

## Проверка подключения

### 1. Проверка PostgreSQL

```bash
# Проверка подключения
psql -U postgres -d klg_db -c "SELECT version();"

# Проверка таблиц
psql -U postgres -d klg_db -c "\dt"
```

### 2. Проверка Redis

```bash
# Проверка подключения
redis-cli ping

# Проверка информации о сервере
redis-cli INFO server

# Тест записи/чтения
redis-cli SET test "Hello Redis"
redis-cli GET test
```

### 3. Проверка через приложение

1. Запустите приложение:
```bash
npm run dev
```

2. Откройте страницу мониторинга: `http://localhost:3000/monitoring`

3. Проверьте статус:
   - **База данных:** должна показывать "✓ Работает"
   - **Redis:** должен показывать "✓ Работает"
   - **Общий статус:** должен быть "Здоров" (зеленый)

---

## Использование Docker (альтернативный способ)

### Docker Compose

Создайте файл `docker-compose.yml` в корне проекта:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: klg_postgres
    environment:
      POSTGRES_DB: klg_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: klg_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Запуск:
```bash
# Запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps

# Остановка
docker-compose down

# Остановка с удалением данных
docker-compose down -v
```

Обновите `.env.local`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=klg_db
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Устранение проблем

### PostgreSQL

**Проблема:** "connection refused"
```bash
# Проверьте, запущен ли PostgreSQL
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Запустите, если не запущен
brew services start postgresql@15  # macOS
sudo systemctl start postgresql     # Linux
```

**Проблема:** "password authentication failed"
- Проверьте пароль в `.env.local`
- Убедитесь, что пользователь существует и имеет права доступа

**Проблема:** "database does not exist"
```bash
# Создайте базу данных
createdb klg_db
```

### Redis

**Проблема:** "connection refused"
```bash
# Проверьте, запущен ли Redis
# macOS
brew services list

# Linux
sudo systemctl status redis-server

# Запустите, если не запущен
brew services start redis  # macOS
sudo systemctl start redis-server  # Linux
```

**Проблема:** "NOAUTH Authentication required"
- Укажите пароль в `.env.local` (REDIS_PASSWORD)

---

## Миграции базы данных

Для управления миграциями рекомендуется использовать инструменты:
- [Prisma](https://www.prisma.io/)
- [TypeORM](https://typeorm.io/)
- [Knex.js](https://knexjs.org/)

Или создайте собственные скрипты миграций в папке `scripts/migrations/`.

---

## Резервное копирование

### PostgreSQL

```bash
# Создание резервной копии
pg_dump -U postgres klg_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из резервной копии
psql -U postgres klg_db < backup_20250122_120000.sql
```

### Redis

```bash
# Сохранение данных Redis
redis-cli SAVE

# Копирование файла дампа
cp /var/lib/redis/dump.rdb backup_redis_$(date +%Y%m%d_%H%M%S).rdb
```

---

## Дополнительные ресурсы

- [Документация PostgreSQL](https://www.postgresql.org/docs/)
- [Документация Redis](https://redis.io/docs/)
- [Документация Docker](https://docs.docker.com/)

---

## Поддержка

Если у вас возникли проблемы с настройкой, проверьте:
1. Логи приложения в консоли
2. Логи PostgreSQL: `/usr/local/var/log/postgres.log` (macOS) или `/var/log/postgresql/` (Linux)
3. Логи Redis: `/usr/local/var/log/redis.log` (macOS) или `/var/log/redis/` (Linux)
4. Страницу мониторинга: `http://localhost:3000/monitoring`
