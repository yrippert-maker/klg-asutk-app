# Кэширование и пагинация

## Реализованные функции

### 1. Кэширование на уровне API (Redis)

**Файлы:**
- `lib/cache/redis.ts` - базовые функции кэширования
- `lib/api/cached-api.ts` - API с интегрированным кэшированием

**Функции:**
- ✅ `getCachedAircraft()` - кэширование списка ВС (TTL: 1 час)
- ✅ `getCachedRisks()` - кэширование рисков (TTL: 30 минут)
- ✅ `getCachedAudits()` - кэширование аудитов (TTL: 30 минут)
- ✅ `getCachedOrganizations()` - кэширование организаций (TTL: 2 часа)
- ✅ `getCachedStats()` - кэширование статистики (TTL: 5 минут)
- ✅ `invalidateCache()` - инвалидация кэша при изменении данных

**Использование в API routes:**
```typescript
import { getCachedAircraft } from '@/lib/api/cached-api';

export async function GET() {
  const aircraft = await getCachedAircraft();
  return NextResponse.json(aircraft, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

**TTL для разных типов данных:**
- Aircraft: 1 час
- Risks: 30 минут
- Audits: 30 минут
- Organizations: 2 часа
- Documents: 1 час
- Regulations: 24 часа
- Stats: 5 минут

### 2. Next.js ISR (Incremental Static Regeneration)

**Реализовано:**
- ✅ Экспорт `revalidate` в страницах для ISR
- ✅ Автоматическое пересоздание страниц по расписанию

**Пример:**
```typescript
// app/regulations/page.tsx
export const revalidate = 3600; // Пересоздавать каждый час
```

**Преимущества:**
- Статические страницы загружаются мгновенно
- Автоматическое обновление без пересборки всего сайта
- Меньше нагрузка на сервер

### 3. SWR для кэширования на клиенте

**Файлы:**
- `lib/swr-config.ts` - конфигурация SWR
- `hooks/useSWRData.ts` - хуки для использования SWR

**Хуки:**
- ✅ `useAircraftData()` - данные о ВС с автоматическим обновлением
- ✅ `useRisksData()` - данные о рисках
- ✅ `useAuditsData()` - данные об аудитах
- ✅ `useStatsData()` - статистика
- ✅ `useOrganizationsData()` - данные об организациях

**Использование:**
```tsx
import { useAircraftData } from '@/hooks/useSWRData';

function AircraftList() {
  const { data, error, isLoading, mutate } = useAircraftData({
    page: 1,
    limit: 50,
    paginate: true,
  });

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;

  return (
    <div>
      {data?.data.map(aircraft => (
        <div key={aircraft.id}>{aircraft.registrationNumber}</div>
      ))}
      <button onClick={() => mutate()}>Обновить</button>
    </div>
  );
}
```

**Настройки SWR:**
- `revalidateOnFocus: false` - не обновлять при фокусе
- `revalidateOnReconnect: true` - обновлять при восстановлении соединения
- `refreshInterval` - автоматическое обновление (настраивается для каждого хука)
- `dedupingInterval: 2000` - дедупликация запросов
- `errorRetryCount: 3` - количество попыток при ошибке

### 4. Пагинация

#### Server-side пагинация

**Реализовано:**
- ✅ `paginatedQuery()` в `lib/database/query-optimizer.ts`
- ✅ Поддержка пагинации в API routes
- ✅ Оптимизированные запросы с LIMIT/OFFSET

**Использование:**
```typescript
// API route
const result = await paginatedQuery(
  'SELECT * FROM aircraft WHERE status = $1',
  page,
  limit,
  ['Активен'],
  'created_at DESC'
);

// Возвращает:
// {
//   data: [...],
//   total: 1000,
//   page: 1,
//   pageSize: 50,
//   totalPages: 20
// }
```

**Запрос с пагинацией:**
```
GET /api/aircraft?page=1&limit=50&paginate=true
```

#### Client-side пагинация

**Компоненты:**
- ✅ `Pagination` - компонент пагинации
- ✅ `usePagination` - хук для пагинации данных
- ✅ `useInfiniteScroll` - хук для бесконечной прокрутки

**Использование:**
```tsx
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';

function DataList({ data }) {
  const { data: paginatedData, pagination } = usePagination(data, {
    page: 1,
    limit: 20,
    total: data.length,
  });

  return (
    <>
      {paginatedData.map(item => <div key={item.id}>{item.name}</div>)}
      <Pagination
        total={pagination.total}
        limit={pagination.limit}
        currentPage={pagination.page}
      />
    </>
  );
}
```

## Интеграция

### API Routes с кэшированием

Все API routes используют кэширование через Redis:

- `/api/aircraft` - кэширование списка ВС
- `/api/risks` - кэширование рисков с фильтрацией
- `/api/audits` - кэширование аудитов с фильтрацией
- `/api/stats` - кэширование статистики
- `/api/organizations` - кэширование организаций

### Инвалидация кэша

При изменении данных необходимо инвалидировать кэш:

```typescript
import { invalidateCache } from '@/lib/api/cached-api';

// После создания/обновления/удаления
await invalidateCache('aircraft', aircraftId);
```

## Настройка

### Redis

Добавьте в `.env.local`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_ENABLED=true
```

### TTL кэша

Настройка TTL в `lib/api/cached-api.ts`:
```typescript
const CACHE_TTL = {
  aircraft: 3600, // 1 час
  risks: 1800, // 30 минут
  // ...
};
```

### SWR настройки

Настройка в `lib/swr-config.ts`:
```typescript
export const swrConfig: SWRConfiguration = {
  refreshInterval: 0, // Отключить автоматическое обновление
  dedupingInterval: 2000, // Дедупликация
  errorRetryCount: 3, // Попытки при ошибке
};
```

## Производительность

### Преимущества кэширования

1. **Снижение нагрузки на БД** - запросы к Redis быстрее чем к PostgreSQL
2. **Быстрая отдача данных** - кэшированные данные возвращаются мгновенно
3. **Масштабируемость** - Redis может обслуживать множество запросов параллельно

### Преимущества SWR

1. **Автоматическое обновление** - данные обновляются в фоне
2. **Дедупликация** - одинаковые запросы выполняются один раз
3. **Кэширование на клиенте** - данные доступны сразу при повторном визите
4. **Оптимистичные обновления** - можно обновлять UI до получения ответа

### Преимущества пагинации

1. **Меньше данных** - загружаются только нужные записи
2. **Быстрее загрузка** - меньше данных = быстрее ответ
3. **Меньше памяти** - не нужно хранить все данные в памяти

## Мониторинг

### Метрики кэша

- Hit rate (процент попаданий в кэш)
- Miss rate (процент промахов)
- TTL для разных типов данных
- Размер кэша

### Метрики SWR

- Количество запросов
- Время ответа
- Количество ошибок
- Частота обновлений

## Рекомендации

1. **Используйте server-side пагинацию** для больших списков (>100 записей)
2. **Настройте TTL** в зависимости от частоты обновления данных
3. **Инвалидируйте кэш** при изменении данных
4. **Мониторьте hit rate** кэша для оптимизации TTL
5. **Используйте SWR** для данных, которые часто обновляются
6. **Применяйте ISR** для статических страниц с редкими обновлениями
