# Архитектура баз данных нового поколения

## Обзор

Система использует современные базы данных нового поколения для оптимальной производительности и масштабируемости.

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│              (Next.js API Routes)                         │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Database Router                          │
│         (Маршрутизация запросов к БД)                     │
└──────────────────────┬────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    OLTP      │ │    OLAP      │ │   NewSQL     │
│              │ │              │ │              │
│ PostgreSQL   │ │ ClickHouse   │ │ TiDB         │
│ CockroachDB  │ │ DuckDB       │ │ YugabyteDB   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## OLTP (Online Transaction Processing)

### PostgreSQL (основная БД)

**Использование:**
- Основные CRUD операции
- Транзакции
- Реляционные данные
- Векторный поиск (pgvector)

**Расширения:**
- `pgvector` - векторный поиск для AI
- `pg_stat_statements` - мониторинг производительности
- `pglogical` - логическая репликация
- `pg_trgm` - полнотекстовый поиск

**Конфигурация:**
```yaml
shared_preload_libraries: pg_stat_statements,pgvector
max_connections: 200
shared_buffers: 256MB
effective_cache_size: 1GB
```

### CockroachDB (распределённая БД)

**Использование:**
- Глобально распределённые данные
- Высокая доступность
- Горизонтальное масштабирование
- Multi-region deployments

**Особенности:**
- ACID транзакции
- SQL совместимость
- Автоматическое шардирование
- Географическое распределение

## OLAP (Online Analytical Processing)

### ClickHouse

**Использование:**
- Аналитические запросы
- Большие объёмы данных
- Агрегации и группировки
- Временные ряды

**Особенности:**
- Колоночное хранение
- Высокая скорость чтения
- Сжатие данных
- Распределённые запросы

**Примеры запросов:**
```sql
-- Аналитика по воздушным судам
SELECT 
  operator,
  COUNT(*) as total,
  AVG(flight_hours) as avg_hours,
  SUM(flight_hours) as total_hours
FROM aircraft_analytics
WHERE created_at >= now() - INTERVAL 1 YEAR
GROUP BY operator
ORDER BY total DESC;
```

### DuckDB

**Использование:**
- Быстрая аналитика
- Встраиваемая аналитика
- Локальная обработка данных
- Интеграция с Pandas/Polars

**Особенности:**
- Работает как библиотека
- Не требует отдельного сервера
- Быстрые запросы на небольших данных
- Поддержка Parquet, CSV, JSON

**Примеры использования:**
```typescript
import { duckdbQuery } from '@/lib/database/duckdb-client';

// Быстрая аналитика
const results = await duckdbQuery(`
  SELECT 
    operator,
    COUNT(*) as count,
    AVG(flight_hours) as avg_hours
  FROM aircraft
  GROUP BY operator
`);
```

## NewSQL

### TiDB

**Использование:**
- Горизонтальное масштабирование
- MySQL совместимость
- HTAP (Hybrid Transactional/Analytical Processing)
- Автоматическое шардирование

**Особенности:**
- Распределённые транзакции
- Автоматическая балансировка
- Горизонтальное масштабирование
- MySQL протокол

### YugabyteDB

**Использование:**
- Распределённые данные
- PostgreSQL совместимость
- Высокая доступность
- Multi-cloud deployments

**Особенности:**
- PostgreSQL API
- Распределённые транзакции
- Автоматическое реплицирование
- Географическое распределение

## Маршрутизация запросов

### Database Router

Система автоматически маршрутизирует запросы к правильной БД:

```typescript
import { dbRead, dbWrite, dbAnalytics } from '@/lib/database/db-router';

// OLTP запрос (PostgreSQL)
const aircraft = await dbRead(
  'SELECT * FROM aircraft WHERE status = $1',
  ['Активен']
);

// Запись (CockroachDB для распределённых данных)
await dbWrite(
  'INSERT INTO aircraft (registration_number) VALUES ($1)',
  ['RA-12345']
);

// Аналитика (ClickHouse)
const stats = await dbAnalytics(`
  SELECT 
    operator,
    COUNT(*) as total
  FROM aircraft_analytics
  GROUP BY operator
`);
```

## Стратегии использования

### Чтение данных

1. **Основные данные** → PostgreSQL
2. **Распределённые данные** → CockroachDB
3. **Аналитика** → ClickHouse или DuckDB

### Запись данных

1. **Транзакции** → PostgreSQL или CockroachDB
2. **Аналитические данные** → ClickHouse (через пайплайны)

### Аналитика

1. **Большие объёмы** → ClickHouse
2. **Быстрая аналитика** → DuckDB
3. **HTAP** → TiDB

## Репликация и шардирование

### PostgreSQL

- Логическая репликация через `pglogical`
- Read replicas для масштабирования чтения
- Шардирование через расширения (Citus)

### CockroachDB

- Автоматическое реплицирование
- Географическое распределение
- Автоматическое шардирование

### ClickHouse

- Репликация через ReplicatedMergeTree
- Шардирование через Distributed таблицы

## Мониторинг

### Метрики производительности

- `pg_stat_statements` для PostgreSQL
- Встроенные метрики для ClickHouse
- Prometheus метрики для всех БД

### Логирование

Все запросы логируются через централизованную систему логирования.

## Миграции

### PostgreSQL

```bash
npm run db:migrate
```

### CockroachDB

```bash
npm run db:migrate:cockroach
```

### ClickHouse

```bash
npm run db:migrate:clickhouse
```

## Переменные окружения

```env
# PostgreSQL
DATABASE_URL=postgresql://klg:klg@localhost:5432/klg

# CockroachDB
COCKROACHDB_URL=postgresql://root@localhost:26257/klg?sslmode=disable

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=klg
CLICKHOUSE_PASSWORD=klg

# TiDB
TIDB_HOST=localhost
TIDB_PORT=4000
TIDB_USER=root
TIDB_PASSWORD=

# YugabyteDB
YUGABYTEDB_URL=postgresql://yugabyte@localhost:5433/yugabyte

# Выбор БД
USE_DISTRIBUTED_DB=false
USE_DUCKDB=false
```

## Производительность

### Оптимизация запросов

1. Используйте правильную БД для типа запроса
2. Индексы для частых запросов
3. Партиционирование для больших таблиц
4. Кэширование через Redis

### Масштабирование

1. **Вертикальное**: Увеличение ресурсов сервера
2. **Горизонтальное**: Шардирование и репликация
3. **Географическое**: Распределение по регионам

## Безопасность

- Шифрование соединений (TLS)
- Аутентификация и авторизация
- Резервное копирование
- Аудит логов

## Резервное копирование

- PostgreSQL: `pg_dump` / `pg_basebackup`
- CockroachDB: Встроенное резервное копирование
- ClickHouse: `clickhouse-backup`
