# Streaming-First Архитектура

## Обзор

Система использует streaming-first архитектуру для real-time обработки данных:

- **Redpanda** - современная замена Kafka
- **Apache Flink** - потоковая обработка
- **RisingWave** - streaming database
- **FastAPI + Pydantic v2** - backend API

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│              (Next.js Frontend)                          │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend                          │
│              (Pydantic v2 Models)                         │
└──────────────────────┬────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Redpanda    │ │    Flink     │ │ RisingWave   │
│  (Events)    │ │ (Processing) │ │  (Storage)   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Компоненты

### Redpanda

**Назначение:** Потоковая платформа для событий

**Использование:**
- Публикация событий изменений данных
- Подписка на события для обработки
- Kafka-совместимый API

**Примеры:**

```typescript
import { publishMessage } from '@/lib/streaming/redpanda-client';

// Публикация события
await publishMessage('aircraft-events', {
  eventType: 'created',
  aircraftId: 123,
  registrationNumber: 'RA-12345',
  timestamp: new Date(),
});
```

### Apache Flink

**Назначение:** Потоковая обработка данных

**Использование:**
- Обработка событий в реальном времени
- Агрегация данных
- Окна времени (tumbling, sliding)
- Состояния (stateful processing)

**Примеры:**

```python
# Flink SQL для агрегации
CREATE TABLE aircraft_events (
    registration_number STRING,
    event_type STRING,
    timestamp TIMESTAMP(3)
) WITH (
    'connector' = 'kafka',
    'topic' = 'aircraft-events',
    'format' = 'json'
);

# Агрегация по окнам
SELECT 
    registration_number,
    COUNT(*) as event_count,
    TUMBLE_START(timestamp, INTERVAL '1' HOUR) as window_start
FROM aircraft_events
GROUP BY registration_number, TUMBLE(timestamp, INTERVAL '1' HOUR);
```

### RisingWave

**Назначение:** Streaming database для real-time аналитики

**Использование:**
- Materialized views на streaming данных
- Real-time запросы
- Источники из Redpanda
- Автоматическое обновление views

**Примеры:**

```sql
-- Создание source из Redpanda
CREATE SOURCE aircraft_events_source
WITH (
    connector = 'kafka',
    topic = 'aircraft-events',
    properties.bootstrap.server = 'localhost:19092'
)
FORMAT PLAIN ENCODE JSON;

-- Создание materialized view
CREATE MATERIALIZED VIEW aircraft_stats AS
SELECT 
    registration_number,
    COUNT(*) as total_events,
    MAX(timestamp) as last_event
FROM aircraft_events_source
GROUP BY registration_number;

-- Запрос к view (real-time)
SELECT * FROM aircraft_stats;
```

### FastAPI Backend

**Назначение:** REST API с Pydantic v2

**Особенности:**
- Type-safe модели данных
- Автоматическая валидация
- Async/await поддержка
- OpenAPI документация

**Примеры:**

```python
from pydantic import BaseModel, Field
from fastapi import FastAPI

class AircraftCreate(BaseModel):
    registration_number: str = Field(..., min_length=1)
    aircraft_type: Optional[str] = None

@app.post("/aircraft")
async def create_aircraft(aircraft: AircraftCreate):
    # Автоматическая валидация через Pydantic
    return await create_aircraft_in_db(aircraft)
```

## Поток данных

1. **Создание/обновление данных** → FastAPI Backend
2. **Публикация события** → Redpanda
3. **Обработка события** → Apache Flink
4. **Сохранение результата** → RisingWave
5. **Запрос данных** → RisingWave Materialized Views

## API Endpoints

### Streaming

- `POST /api/v1/streaming/events` - Публикация события
- `GET /api/v1/streaming/views/{view_name}` - Получение данных из view
- `GET /api/v1/streaming/health` - Проверка здоровья

### Aircraft

- `GET /api/v1/aircraft` - Список ВС
- `POST /api/v1/aircraft` - Создание ВС (публикует событие)
- `PUT /api/v1/aircraft/{id}` - Обновление ВС (публикует событие)

## Конфигурация

### Переменные окружения

```env
# Redpanda
REDPANDA_BROKERS=localhost:19092
REDPANDA_CLIENT_ID=klg-backend

# RisingWave
RISINGWAVE_URL=postgresql://root:risingwave@localhost:4566/dev

# Flink
FLINK_REST_URL=http://localhost:8081
```

## Мониторинг

### Redpanda

- Admin UI: http://localhost:19644
- Schema Registry: http://localhost:18081

### Flink

- Web UI: http://localhost:8081

### RisingWave

- Prometheus: http://localhost:5691/metrics
- Grafana: http://localhost:5692

## Запуск

```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск FastAPI backend
cd backend
uvicorn app.main:app --reload

# Запуск Flink job
flink run -c AircraftStreamingJob aircraft-streaming-job.jar
```

## Примеры использования

### Публикация события при создании ВС

```python
# В FastAPI endpoint
@app.post("/aircraft")
async def create_aircraft(aircraft: AircraftCreate):
    # Создание в БД
    created = await db.create_aircraft(aircraft)
    
    # Публикация события
    await publish_event('aircraft-events', {
        'event_type': 'created',
        'aircraft_id': created.id,
        'registration_number': created.registration_number,
        'timestamp': datetime.now(),
    })
    
    return created
```

### Обработка события во Flink

```python
# Flink обрабатывает событие и агрегирует данные
# Результат сохраняется в RisingWave materialized view
```

### Запрос real-time статистики

```typescript
// Запрос к RisingWave materialized view
const stats = await queryMaterializedView('aircraft_stats', {
  registration_number: 'RA-12345'
});
```

## Преимущества

1. **Real-time обработка** - данные обрабатываются мгновенно
2. **Масштабируемость** - горизонтальное масштабирование
3. **Надёжность** - гарантия доставки сообщений
4. **Производительность** - оптимизированная обработка потоков
5. **Гибкость** - легко добавлять новые обработчики

## Troubleshooting

### Redpanda не запускается

```bash
docker-compose logs redpanda
```

### Flink job не запускается

Проверьте логи Flink: http://localhost:8081

### RisingWave не подключается

Проверьте переменную окружения `RISINGWAVE_URL`
