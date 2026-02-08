# Система аудита и аналитики

## Обзор

Реализована комплексная система аудита, логирования действий пользователей и расширенной аналитики для дашборда.

## Компоненты системы

### 1. Система аудита (`lib/audit/`)

#### `audit-service.ts`
- **Создание записей аудита** - логирование всех изменений данных
- **История изменений** - получение истории для конкретного ресурса
- **Поиск записей** - фильтрация по пользователю, действию, типу ресурса, датам, IP адресу
- **Откат изменений** - восстановление предыдущего состояния
- **Экспорт логов** - экспорт в JSON или CSV

#### `user-activity-logger.ts`
- **Логирование действий пользователей:**
  - Просмотр данных (`logView`)
  - Создание записей (`logCreate`)
  - Изменение записей (`logUpdate`)
  - Удаление записей (`logDelete`)
  - Экспорт данных (`logExport`)
  - Использование ИИ агента (`logAIAgentUsage`)

### 2. API Endpoints

#### `/api/audit`
- `GET /api/audit` - поиск записей аудита с фильтрами
- `GET /api/audit?format=json|csv` - экспорт логов
- `GET /api/audit/[resourceType]/[resourceId]` - история изменений ресурса
- `POST /api/audit/rollback` - откат изменений

#### `/api/analytics`
- `GET /api/analytics?type=timeseries` - данные для графиков по времени
- `GET /api/analytics?type=compare` - сравнение периодов
- `GET /api/analytics?type=forecast` - прогнозирование
- `GET /api/analytics?type=activity` - статистика активности пользователей

#### `/api/logs/search`
- `GET /api/logs/search` - поиск по всем логам (файловым и БД)

### 3. Страница истории изменений

**Путь:** `/audit-history`

**Функционал:**
- Просмотр всех записей аудита
- Фильтрация по действию, типу ресурса, датам, поиск
- Просмотр деталей изменений (старые/новые значения)
- Откат изменений (для UPDATE операций)
- Экспорт в CSV или JSON

### 4. Система логирования

#### Ротация логов (`lib/logs/log-rotation.ts`)
- **По размеру** - удаление файлов, превышающих лимит
- **По времени** - удаление старых файлов (настраиваемый retention)
- **Очистка БД** - удаление старых записей из `audit_log`

**Команда:** `npm run logs:rotate`

#### Поиск по логам (`lib/logs/log-search.ts`)
- Поиск в файловых логах (JSON формат)
- Поиск в базе данных (audit_log)
- Комплексный поиск по всем источникам

### 5. Аналитика (`lib/analytics/analytics-service.ts`)

#### Временные ряды
- Группировка по дням, неделям, месяцам
- Поддержка различных типов ресурсов (aircraft, risks, audits)

#### Сравнение периодов
- Текущий период vs предыдущий период
- Расчет изменений в процентах
- Определение тренда (рост/падение/стабильно)

#### Прогнозирование
- Простое линейное прогнозирование на основе исторических данных
- Настраиваемый период прогноза

#### Статистика активности
- Общее количество действий
- Распределение по типам действий
- Топ пользователей по активности

## Использование

### Интеграция логирования в API endpoints

```typescript
import { logCreate, logUpdate, logDelete, getClientIP, getUserAgent } from '@/lib/audit/user-activity-logger';

// При создании записи
await logCreate('aircraft', newAircraftId, newValues, userId, ipAddress, userAgent);

// При изменении записи
await logUpdate('aircraft', aircraftId, oldValues, newValues, userId, ipAddress, userAgent);

// При удалении записи
await logDelete('aircraft', aircraftId, oldValues, userId, ipAddress, userAgent);
```

### Получение истории изменений

```typescript
import { getAuditHistory } from '@/lib/audit/audit-service';

const history = await getAuditHistory('aircraft', aircraftId, 50);
```

### Поиск записей аудита

```typescript
import { searchAuditLogs } from '@/lib/audit/audit-service';

const { logs, total } = await searchAuditLogs({
  userId: 'user-id',
  action: 'UPDATE',
  resourceType: 'aircraft',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
}, 100, 0);
```

### Откат изменений

```typescript
import { rollbackChange } from '@/lib/audit/audit-service';

const success = await rollbackChange(auditLogId);
```

## Настройка

### Ротация логов

Создайте cron job для автоматической ротации:

```bash
# Ежедневно в 2:00
0 2 * * * cd /path/to/project && npm run logs:rotate
```

Или используйте системный таймер (systemd):

```ini
[Unit]
Description=Rotate KLG logs
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/npm run logs:rotate

[Timer]
OnCalendar=daily
OnCalendar=02:00

[Install]
WantedBy=timers.target
```

### Retention период

Настройте в `.env.local`:

```env
AUDIT_LOG_RETENTION_DAYS=90
LOG_RETENTION_DAYS=30
LOG_MAX_SIZE=10485760  # 10MB
LOG_MAX_FILES=10
```

## Структура данных

### Таблица `audit_log`

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Партиционирование

Таблица `audit_log` партиционирована по месяцам для оптимизации производительности при больших объемах данных.

## Безопасность

- Все действия пользователей логируются
- IP адреса и User-Agent сохраняются для аудита безопасности
- Откат изменений требует подтверждения
- Экспорт логов доступен только авторизованным пользователям
- Rate limiting на всех API endpoints

## Производительность

- Индексы на часто используемых полях
- Партиционирование таблицы audit_log
- Пагинация результатов поиска
- Кэширование статистики (опционально через Redis)

## Мониторинг

- Логи аудита доступны через страницу `/audit-history`
- Статистика активности через `/api/analytics?type=activity`
- Автоматическая ротация предотвращает переполнение диска
