# Оптимизация производительности

## Реализованные оптимизации

### 1. Оптимизация изображений и ресурсов

#### Next.js Image компонент
- ✅ Используется `next/image` для автоматической оптимизации
- ✅ Поддержка форматов AVIF и WebP
- ✅ Адаптивные размеры для разных устройств
- ✅ Ленивая загрузка по умолчанию

**Конфигурация** (`next.config.js`):
```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  domains: process.env.NEXT_PUBLIC_IMAGE_DOMAINS?.split(',') || [],
  minimumCacheTTL: 60,
}
```

**Использование**:
```tsx
import AccessibleImage from '@/components/AccessibleImage';

<AccessibleImage
  src="/logo.png"
  alt="Логотип"
  width={200}
  height={50}
  priority={true} // для критических изображений
/>
```

#### Сжатие (gzip/brotli)
- ✅ Включено автоматическое сжатие в Next.js
- ✅ Поддержка gzip и brotli
- ✅ Настраивается через `compress: true` в `next.config.js`

#### Минификация CSS и JavaScript
- ✅ SWC минификация включена (`swcMinify: true`)
- ✅ Автоматическая минификация в production сборке
- ✅ Source maps отключены в production для уменьшения размера

#### CDN для статических ресурсов
- ✅ Настройка доменов изображений через `NEXT_PUBLIC_IMAGE_DOMAINS`
- ✅ Кэширование статических ресурсов
- ✅ Рекомендуется использовать Vercel, Cloudflare или AWS CloudFront

**Настройка**:
```env
NEXT_PUBLIC_IMAGE_DOMAINS=cdn.example.com,images.example.com
```

### 2. Lazy Loading

#### React.lazy для компонентов
- ✅ Реализован `lib/performance/lazy-components.tsx`
- ✅ Lazy загрузка модальных окон
- ✅ Lazy загрузка страниц для code splitting

**Использование**:
```tsx
import { LazyAIAgentModal, LazyComponentWrapper } from '@/lib/performance/lazy-components';

<LazyComponentWrapper>
  <LazyAIAgentModal isOpen={isOpen} onClose={onClose} />
</LazyComponentWrapper>
```

#### Виртуализация списков
- ✅ Реализован `VirtualizedList` компонент
- ✅ Использует `react-window` для рендеринга больших списков
- ✅ Рендерит только видимые элементы

**Использование**:
```tsx
import VirtualizedList from '@/components/VirtualizedList';

<VirtualizedList
  items={largeArray}
  height={600}
  itemHeight={50}
  renderItem={(item) => <div>{item.name}</div>}
/>
```

#### Intersection Observer для отложенной загрузки
- ✅ Реализован хук `useIntersectionObserver`
- ✅ Компонент `LazyLoad` для отложенной загрузки контента

**Использование**:
```tsx
import { LazyLoad } from '@/lib/performance/intersection-observer';

<LazyLoad fallback={<div>Загрузка...</div>}>
  <HeavyComponent />
</LazyLoad>
```

### 3. Оптимизация базы данных

#### Индексы
- ✅ Базовые индексы в `schema.sql`
- ✅ Дополнительные оптимизированные индексы в `optimization-indexes.sql`
- ✅ Составные индексы для частых запросов
- ✅ Частичные индексы для активных записей
- ✅ GIN индексы для полнотекстового поиска

**Выполнение**:
```bash
psql -U postgres -d klg_db -f lib/database/optimization-indexes.sql
```

#### Оптимизация запросов
- ✅ Утилиты в `lib/database/query-optimizer.ts`
- ✅ Пакетное выполнение запросов
- ✅ Оптимизированная пагинация
- ✅ Полнотекстовый поиск с использованием индексов

**Использование**:
```typescript
import { paginatedQuery, fullTextSearch } from '@/lib/database/query-optimizer';

// Пагинация
const result = await paginatedQuery(
  'SELECT * FROM aircraft WHERE status = $1',
  1, // page
  50, // pageSize
  ['Активен'],
  'created_at DESC'
);

// Полнотекстовый поиск
const results = await fullTextSearch(
  'aircraft',
  'registration_number',
  'RA-12345',
  ['aircraft_type', 'operator_id']
);
```

#### Connection Pooling
- ✅ Реализован в `lib/database/connection.ts`
- ✅ Настраиваемый размер пула
- ✅ Автоматическое управление соединениями
- ✅ Timeout для idle соединений

**Настройка**:
```env
DB_POOL_MAX=20
DB_PORT=5432
```

#### Read Replicas
- ✅ Реализована поддержка в `lib/database/read-replica.ts`
- ✅ Автоматический fallback на primary при ошибке replica
- ✅ Разделение запросов на чтение и запись

**Настройка**:
```env
# Primary (для записи)
DB_HOST=primary.example.com
DB_PORT=5432

# Replica (для чтения)
DB_REPLICA_HOST=replica.example.com
DB_REPLICA_PORT=5432
DB_REPLICA_NAME=klg_db
DB_REPLICA_USER=postgres
DB_REPLICA_PASSWORD=password
DB_REPLICA_POOL_MAX=20
```

**Использование**:
```typescript
import { readQuery, writeQuery } from '@/lib/database/read-replica';

// Чтение (использует replica)
const result = await readQuery('SELECT * FROM aircraft');

// Запись (использует primary)
await writeQuery('INSERT INTO aircraft ...');
```

## Рекомендации по использованию

### Изображения
1. Всегда используйте `AccessibleImage` вместо обычного `<img>`
2. Указывайте `priority={true}` только для критических изображений (above the fold)
3. Используйте CDN для статических изображений
4. Оптимизируйте изображения перед загрузкой (сжатие, правильные размеры)

### Lazy Loading
1. Используйте `React.lazy` для больших компонентов и модальных окон
2. Применяйте `LazyLoad` для контента ниже fold
3. Виртуализируйте списки с более чем 100 элементами

### База данных
1. Регулярно обновляйте статистику: `ANALYZE table_name;`
2. Мониторьте медленные запросы через `EXPLAIN ANALYZE`
3. Используйте read replicas для распределения нагрузки
4. Применяйте пагинацию для больших выборок
5. Используйте индексы для часто запрашиваемых полей

## Мониторинг производительности

### Метрики для отслеживания
- Время загрузки страниц
- Размер bundle
- Количество запросов к БД
- Время выполнения запросов
- Использование памяти

### Инструменты
- Next.js Analytics
- Lighthouse
- PostgreSQL `pg_stat_statements`
- Sentry Performance Monitoring

## Дополнительные оптимизации

### Кэширование
- Используйте Redis для кэширования частых запросов
- Настройте CDN кэширование для статических ресурсов
- Применяйте SWR для клиентского кэширования

### Code Splitting
- Динамические импорты для больших библиотек
- Route-based code splitting (автоматически в Next.js)
- Component-based code splitting с React.lazy

### Bundle Optimization
- Анализ bundle размера: `npm run build -- --analyze`
- Удаление неиспользуемого кода
- Tree shaking для библиотек
