# Паттерны устойчивости системы

## Обзор

Система использует комплексный набор паттернов устойчивости для обеспечения надежности, масштабируемости и отказоустойчивости в production окружении.

## Реализованные паттерны

### 1. Circuit Breaker
**Файл:** `lib/resilience/circuit-breaker.ts`

Защита от каскадных сбоев при проблемах с внешними сервисами.

**Использование:**
```typescript
import { circuitBreakers } from '@/lib/resilience/circuit-breaker';

const result = await circuitBreakers.ai.execute(async () => {
  return await aiApi.chat(prompt);
});
```

**Глобальные circuit breakers:**
- `ai` - для Anthropic Claude API
- `database` - для PostgreSQL
- `redis` - для Redis
- `externalApi` - для внешних API

### 2. Bulkhead Pattern
**Файл:** `lib/resilience/bulkhead.ts`

Изоляция ресурсов для предотвращения перегрузки одного компонента от влияния на другие.

**Использование:**
```typescript
import { bulkheads } from '@/lib/resilience/bulkhead';

const result = await bulkheads.ai.execute(async () => {
  // Максимум 5 AI запросов одновременно
  return await processAIRequest();
});
```

**Глобальные bulkheads:**
- `ai` - 5 одновременных запросов
- `database` - 20 одновременных запросов
- Модуль нормативной базы (knowledge) вынесен в отдельный сервис; лимит `knowledgeGraph` не используется в этом репозитории.
- `fileProcessing` - 3 файла одновременно

### 3. Retry с Exponential Backoff
**Файл:** `lib/resilience/retry.ts`

Автоматические повторы при временных сбоях с экспоненциальной задержкой.

**Использование:**
```typescript
import { retryWithBackoff, RETRY_CONFIGS } from '@/lib/resilience/retry';

const result = await retryWithBackoff(
  () => openai.chat.completions.create(...),
  RETRY_CONFIGS.OPENAI_API
);
```

### 4. Timeout для всех внешних запросов
**Файл:** `lib/resilience/timeout.ts`

Защита от зависаний при обращениях к внешним сервисам.

**Использование:**
```typescript
import { withTimeout, TIMEOUTS } from '@/lib/resilience/timeout';

const result = await withTimeout(
  openai.chat.completions.create(...),
  TIMEOUTS.OPENAI_API // 30 секунд
);
```

**Предустановленные таймауты:**
- `OPENAI_API`: 30 секунд
- `DATABASE_QUERY`: 5 секунд
- `DATABASE_WRITE`: 10 секунд
- `KNOWLEDGE_GRAPH`: 60 секунд

### 5. Graceful Degradation
**Файл:** `lib/resilience/graceful-degradation.ts`

Система продолжает работать даже при частичных сбоях.

**Использование:**
```typescript
import { getKnowledgeGraphWithFallback } from '@/lib/resilience/graceful-degradation';

// Автоматически использует fallback при ошибках
const graph = await getKnowledgeGraphWithFallback();
```

### 6. Overload Protection
**Файл:** `lib/resilience/overload-protection.ts`

Защита от перегрузки слишком большим количеством запросов.

**Использование:**
```typescript
import { overloadProtectors } from '@/lib/resilience/overload-protection';

if (!overloadProtectors.ai.check()) {
  return NextResponse.json(
    { error: 'Service overloaded' },
    { status: 503 }
  );
}
```

### 7. Rate Limiting с Burst Protection
**Файл:** `lib/rate-limit.ts`

Ограничение количества запросов с поддержкой burst-запросов.

**Использование:**
```typescript
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

const result = rateLimit(identifier, 100, 60000); // 100 запросов в минуту
if (!result.allowed) {
  // Запрос отклонен
}
```

### 8. Auto Recovery
**Файл:** `lib/resilience/auto-recovery.ts`

Автоматическое восстановление работы компонентов после сбоев.

**Использование:**
```typescript
import { autoRecovery } from '@/lib/resilience/auto-recovery';

await autoRecovery.database.recover(async () => {
  return await connectToDatabase();
});
```

### 9. Monitoring и Alerting
**Файл:** `lib/monitoring/metrics.ts`

Метрики производительности и система алертов.

**Использование:**
```typescript
import { recordPerformance, createAlert } from '@/lib/monitoring/metrics';

recordPerformance('/api/endpoint', 'POST', duration, statusCode);
createAlert('warning', 'High memory usage', 'system', { usage: 85 });
```

**API endpoint:** `/api/monitoring/metrics`

### 10. Distributed Tracing
**Файл:** `lib/tracing/tracer.ts`

Отслеживание запросов через всю систему.

**Использование:**
```typescript
import { tracedOperation, tracer } from '@/lib/tracing/tracer';

const context = tracer.createTrace('my-operation');
const result = await tracedOperation(context, 'database-query', async () => {
  return await query('SELECT * FROM aircraft');
});
```

**API endpoint:** `/api/tracing`

### 11. Graceful Shutdown
**Файл:** `lib/graceful-shutdown.ts`

Корректное завершение работы приложения.

**Автоматически инициализируется** при старте приложения через `lib/init.ts`.

Обрабатывает сигналы:
- `SIGTERM` - стандартный сигнал завершения
- `SIGINT` - Ctrl+C
- `uncaughtException` - необработанные исключения
- `unhandledRejection` - необработанные промисы

### 12. Health Checks и Kubernetes Probes
**Файл:** `app/api/health/route.ts`, `k8s/deployment.yaml`

Проверка здоровья системы для Kubernetes.

**Endpoints:**
- `/api/health` - liveness probe
- `/api/health?readiness=true` - readiness probe

## Интеграция в API endpoints

### Пример полной интеграции (AI Chat)

```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceContext = tracer.createTrace('POST /api/ai-chat');

  try {
    // 1. Overload Protection
    if (!overloadProtectors.ai.check()) {
      return NextResponse.json({ error: 'Service overloaded' }, { status: 503 });
    }

    // 2. Rate Limiting
    const limitCheck = rateLimit(getRateLimitIdentifier(request));
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 3. Bulkhead (изоляция ресурсов)
    const result = await bulkheads.ai.execute(async () => {
      // 4. Circuit Breaker
      return circuitBreakers.openai.execute(async () => {
        // 5. Retry с exponential backoff
        return retryWithBackoff(
          // 6. Timeout
          () => withTimeout(
            openai.chat.completions.create(...),
            TIMEOUTS.OPENAI_API
          ),
          RETRY_CONFIGS.OPENAI_API
        );
      });
    });

    // 7. Monitoring
    recordPerformance('/api/ai-chat', 'POST', Date.now() - startTime, 200);
    tracer.finishSpan(traceContext, 'completed');

    return NextResponse.json(result);
  } catch (error) {
    recordPerformance('/api/ai-chat', 'POST', Date.now() - startTime, 500);
    tracer.finishSpan(traceContext, 'error', error);
    return handleError(error);
  }
}
```

## Порядок применения паттернов

1. **Overload Protection** - проверка общей нагрузки
2. **Rate Limiting** - ограничение запросов на пользователя/IP
3. **Bulkhead** - изоляция ресурсов
4. **Circuit Breaker** - защита от каскадных сбоев
5. **Retry** - повтор при временных сбоях
6. **Timeout** - защита от зависаний
7. **Graceful Degradation** - fallback при ошибках
8. **Monitoring** - запись метрик
9. **Tracing** - отслеживание запросов

## Конфигурация

Все паттерны настраиваются через переменные окружения и константы в соответствующих файлах.

## Мониторинг

- Метрики: `/api/monitoring/metrics`
- Traces: `/api/tracing`
- Health: `/api/health`

## Production готовность

✅ Все паттерны реализованы и протестированы
✅ Интегрированы в критические endpoints
✅ Настроены мониторинг и alerting
✅ Подготовлены Kubernetes конфигурации
✅ Реализован graceful shutdown
