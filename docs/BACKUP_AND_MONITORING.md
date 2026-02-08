# Резервное копирование и мониторинг

## Резервное копирование

### Автоматическое резервное копирование

Скрипт резервного копирования находится в `scripts/backup-database.ts`.

#### Настройка

Добавьте переменные окружения в `.env.local`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=klg_db
DB_USER=postgres
DB_PASSWORD=your-password
BACKUP_DIR=./backups
MAX_BACKUPS=30
COMPRESS_BACKUPS=true
```

#### Запуск вручную

```bash
npm run backup:db
```

#### Автоматический запуск через cron

Добавьте в crontab для ежедневного резервного копирования в 2:00:

```bash
0 2 * * * cd /path/to/klg_asutk_app && npm run backup:db
```

Или для резервного копирования каждый час:

```bash
0 * * * * cd /path/to/klg_asutk_app && npm run backup:db
```

#### Восстановление из резервной копии

```bash
npm run restore:db -- backups/backup_klg_db_2025-01-21T10-00-00.sql.gz
```

Или список доступных резервных копий:

```bash
npm run restore:db
```

### Хранение резервных копий

Резервные копии сохраняются в директории `backups/` (или указанной в `BACKUP_DIR`).

**Рекомендации:**
- Храните резервные копии в безопасном месте (не на том же сервере)
- Используйте облачное хранилище (S3, Google Cloud Storage)
- Шифруйте резервные копии перед отправкой
- Тестируйте восстановление регулярно

### Версионирование

Система автоматически:
- Создает резервные копии с timestamp в имени файла
- Удаляет старые резервные копии (по умолчанию хранит 30 последних)
- Сжимает резервные копии (gzip)

---

## Мониторинг

### Health Checks

API endpoint для проверки здоровья системы: `/api/health`

**Проверяет:**
- Состояние базы данных (PostgreSQL)
- Состояние Redis
- Свободное место на диске

**Ответ:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "disk": { "status": "ok", "freeSpace": 100 }
  },
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

**Статусы:**
- `healthy` - все системы работают
- `degraded` - некоторые системы недоступны (но не критичные)
- `unhealthy` - критические системы недоступны

### Метрики производительности

API endpoint для получения метрик: `/api/metrics`

**Параметры:**
- `type` - тип метрик (`performance`, `performance-details`, `all`)
- `endpoint` - фильтр по endpoint (опционально)
- `startTime` - начало периода (опционально)
- `endTime` - конец периода (опционально)

**Примеры:**

```bash
# Статистика производительности
GET /api/metrics?type=performance

# Детальные метрики
GET /api/metrics?type=performance-details&endpoint=/api/aircraft

# Все метрики за период
GET /api/metrics?startTime=2025-01-21T00:00:00Z&endTime=2025-01-21T23:59:59Z
```

### Автоматическое отслеживание

Система автоматически записывает:
- Время ответа каждого API запроса
- Код статуса ответа
- Медленные запросы (> 1 секунды) логируются

### Страница мониторинга

Доступна по адресу `/monitoring`:
- Отображает состояние системы в реальном времени
- Показывает метрики производительности
- Автоматически обновляется каждые 30 секунд

---

## Интеграция с внешними системами мониторинга

### Prometheus

Для интеграции с Prometheus создайте endpoint `/api/metrics/prometheus`:

```typescript
export async function GET() {
  const stats = getPerformanceStats();
  return new Response(
    `# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total ${stats.count}

# HELP api_request_duration_seconds Request duration in seconds
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds ${stats.avgDuration / 1000}
`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
```

### DataDog

Установите DataDog Agent и настройте интеграцию:

```typescript
import { StatsD } from 'node-statsd';
const client = new StatsD();

recordPerformance(endpoint, method, duration, statusCode) {
  client.timing('api.request.duration', duration, { endpoint, method });
  client.increment('api.requests', 1, { endpoint, method, status: statusCode });
}
```

### Sentry

Для отслеживания ошибок:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## Алерты

### Настройка алертов

Рекомендуется настроить алерты для:

1. **Критические ошибки** - статус системы `unhealthy`
2. **Медленные запросы** - время ответа > 2 секунд
3. **Высокий процент ошибок** - > 5% запросов возвращают ошибку
4. **Недоступность БД** - база данных не отвечает
5. **Недоступность Redis** - Redis не отвечает
6. **Мало места на диске** - < 10% свободного места

### Email уведомления

Пример интеграции с email:

```typescript
import { sendEmail } from '@/lib/notifications/email';

if (health.status === 'unhealthy') {
  await sendEmail({
    to: 'admin@example.com',
    subject: '⚠️ Система неисправна',
    body: `Статус системы: ${health.status}`,
  });
}
```

### Webhook уведомления

```typescript
async function sendWebhookAlert(health: HealthStatus) {
  await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `Система неисправна: ${health.status}`,
    }),
  });
}
```

---

## Рекомендации

1. **Регулярное тестирование восстановления** - проверяйте резервные копии раз в месяц
2. **Мониторинг 24/7** - используйте внешние сервисы (UptimeRobot, Pingdom)
3. **Логирование** - сохраняйте логи для анализа
4. **Метрики** - отслеживайте тренды производительности
5. **Алерты** - настройте уведомления для критических событий

---

**Дата создания:** 2025-01-21  
**Версия:** 1.0
