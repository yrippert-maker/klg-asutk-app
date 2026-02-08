# Документация по масштабированию

## Архитектура базы данных

### PostgreSQL

Система использует PostgreSQL для хранения данных.

#### Схема базы данных

Схема находится в `lib/database/schema.sql` и включает:

- **Нормализованные таблицы** с правильными связями
- **Индексы** на часто запрашиваемые поля
- **Партиционирование** для больших таблиц (audit_log)
- **Триггеры** для автоматического обновления `updated_at`
- **Представления** для удобных запросов

#### Индексы

Созданы индексы для:
- Поиска по регистрационным номерам (B-tree)
- Полнотекстового поиска (GIN с pg_trgm)
- Фильтрации по статусам
- Связей между таблицами (foreign keys)

#### Партиционирование

Таблица `audit_log` партиционирована по месяцам для оптимизации:
- Быстрый доступ к недавним данным
- Легкое удаление старых данных
- Улучшенная производительность запросов

#### Read Replicas

Для масштабирования чтения рекомендуется настроить read replicas:

```sql
-- Настройка на master
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET hot_standby = on;
```

### Миграции

Используйте инструменты для миграций:
- `node-pg-migrate`
- `knex.js`
- `TypeORM`

Пример:
```bash
npm install -g node-pg-migrate
pg-migrate create initial-schema
pg-migrate up
```

---

## Кэширование

### Redis

Система использует Redis для кэширования данных.

#### Настройка

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

#### Использование

```typescript
import { getCache, setCache, invalidateResourceCache } from '@/lib/cache/redis';

// Получение из кэша
const aircraft = await getCache<Aircraft[]>('aircraft:all');

// Сохранение в кэш
await setCache('aircraft:all', aircraft, 300); // TTL 5 минут

// Инвалидация
await invalidateResourceCache('aircraft', 'aircraft-id');
```

#### TTL для разных типов данных

- ВС: 5 минут
- Риски: 3 минуты
- Организации: 10 минут
- Аудиты: 5 минут
- Нормативные документы: 1 час
- Статистика: 1 минута

#### Кэширование с тегами

Для групповой инвалидации:

```typescript
import { setCacheWithTags, invalidateByTags } from '@/lib/cache/redis';

await setCacheWithTags('key', data, ['aircraft', 'stats'], 300);
await invalidateByTags(['aircraft']); // Инвалидирует все с тегом 'aircraft'
```

---

## Микросервисная архитектура

### Структура сервисов

Система может быть разделена на следующие микросервисы:

1. **Auth Service** (порт 3001) - Аутентификация и авторизация
2. **Aircraft Service** (порт 3002) - Управление ВС
3. **Documents Service** (порт 3003) - Управление документами
4. **AI Agent Service** (порт 3004) - ИИ агент
5. **Notifications Service** (порт 3005) - Уведомления
6. **Audit Service** (порт 3006) - Аудит и логирование

### Конфигурация

```env
AUTH_SERVICE_URL=http://localhost:3001
AIRCRAFT_SERVICE_URL=http://localhost:3002
DOCUMENTS_SERVICE_URL=http://localhost:3003
AI_AGENT_SERVICE_URL=http://localhost:3004
NOTIFICATIONS_SERVICE_URL=http://localhost:3005
AUDIT_SERVICE_URL=http://localhost:3006
```

### Использование

```typescript
import { serviceClients } from '@/lib/microservices/service-client';

// Вызов сервиса
const aircraft = await serviceClients[ServiceType.AIRCRAFT].get('/aircraft');

// Проверка здоровья
const health = await checkServicesHealth();
```

### API Gateway

В production рекомендуется использовать API Gateway:
- **Kong** - Open source API Gateway
- **AWS API Gateway** - Managed service
- **NGINX** - Reverse proxy с дополнительными функциями

Пример конфигурации Kong:
```yaml
services:
  - name: aircraft-service
    url: http://aircraft-service:3002
    routes:
      - name: aircraft-route
        paths:
          - /api/aircraft
```

### Message Queue

Для асинхронных задач рекомендуется использовать:
- **RabbitMQ** - Надежная очередь сообщений
- **Apache Kafka** - Для потоковой обработки
- **Redis Pub/Sub** - Простое решение для начала

Пример с Redis:
```typescript
import { redis } from '@/lib/cache/redis';

// Публикация
await redis.publish('notifications', JSON.stringify({ type: 'risk', data }));

// Подписка
const subscriber = redis.duplicate();
await subscriber.subscribe('notifications');
subscriber.on('message', (channel, message) => {
  const data = JSON.parse(message);
  // Обработка
});
```

---

## Оптимизация API

### Batch запросы

Система поддерживает batch запросы для получения нескольких ресурсов за один запрос:

```typescript
// Запрос
POST /api/batch
{
  "requests": [
    { "method": "GET", "path": "/aircraft" },
    { "method": "GET", "path": "/risks" },
    { "method": "GET", "path": "/organizations" }
  ]
}

// Ответ
{
  "results": [
    { "status": 200, "body": [...] },
    { "status": 200, "body": [...] },
    { "status": 200, "body": [...] }
  ],
  "count": 3
}
```

### Компрессия

Next.js автоматически сжимает ответы с помощью gzip/brotli.

Для дополнительной оптимизации можно использовать middleware:

```typescript
import compression from 'compression';

export function middleware(request: NextRequest) {
  // Компрессия уже включена в Next.js
  // Дополнительные настройки в next.config.js
}
```

### HTTP/2

HTTP/2 включен автоматически при использовании HTTPS.

Преимущества:
- Мультиплексирование запросов
- Server push (опционально)
- Сжатие заголовков

### CDN

Для статических ресурсов рекомендуется использовать CDN:
- **Vercel** - Автоматический CDN
- **Cloudflare** - Глобальный CDN
- **AWS CloudFront** - Managed CDN

Настройка в `next.config.js`:
```javascript
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
}
```

---

## Мониторинг производительности

### Метрики для отслеживания

1. **Время ответа API** - должно быть < 200ms для большинства запросов
2. **Использование памяти** - мониторинг утечек
3. **Использование CPU** - оптимизация тяжелых операций
4. **Размер базы данных** - планирование партиционирования
5. **Hit rate кэша** - должно быть > 80%

### Инструменты

- **Prometheus + Grafana** - Метрики и визуализация
- **New Relic** - APM (Application Performance Monitoring)
- **Datadog** - Полный мониторинг стека
- **Sentry** - Отслеживание ошибок

---

## Горизонтальное масштабирование

### Load Balancing

Используйте load balancer для распределения нагрузки:

```nginx
upstream klg_app {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://klg_app;
    }
}
```

### Auto Scaling

Настройте auto scaling на основе:
- CPU utilization
- Memory usage
- Request rate
- Queue length

Пример для Kubernetes:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: klg-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: klg-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Рекомендации

1. **Начните с монолита** - Разделяйте на микросервисы только при необходимости
2. **Используйте кэширование** - Это самое простое улучшение производительности
3. **Мониторьте метрики** - Нельзя оптимизировать то, что не измеряется
4. **Тестируйте под нагрузкой** - Используйте нагрузочное тестирование
5. **Планируйте партиционирование** - Заранее для больших таблиц

---

**Дата создания:** 2025-01-21  
**Версия:** 1.0
