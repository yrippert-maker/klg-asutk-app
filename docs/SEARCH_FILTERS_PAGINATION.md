# Документация по поиску, фильтрам и пагинации

## Глобальный поиск

### Компонент GlobalSearch

Компонент для глобального поиска по всем данным системы с автодополнением.

**Использование:**

```tsx
import GlobalSearch from '@/components/GlobalSearch';

<GlobalSearch
  isOpen={isGlobalSearchOpen}
  onClose={() => setIsGlobalSearchOpen(false)}
  data={{
    aircraft: aircraftList,
    risks: risksList,
    organizations: organizationsList,
  }}
/>
```

**Функции:**
- Поиск по ВС (номер, тип, оператор)
- Поиск по рискам (название, уровень, категория)
- Поиск по организациям (название, ИНН)
- Автодополнение при вводе
- Сохранение истории поисков
- Навигация к результатам

**Горячие клавиши:**
- `Ctrl+K` - открыть глобальный поиск
- `Enter` - выполнить поиск
- `Esc` - закрыть поиск
- `Arrow Up/Down` - навигация по предложениям

---

## Фильтры и сортировка

### Компонент FilterPanel

Панель фильтров с поддержкой множественных фильтров и сортировки.

**Использование:**

```tsx
import FilterPanel from '@/components/FilterPanel';

<FilterPanel
  filters={{
    status: [
      { value: 'active', label: 'Активные' },
      { value: 'maintenance', label: 'На обслуживании' },
    ],
    organization: organizations.map(org => ({
      value: org.id,
      label: org.name,
    })),
  }}
  sortOptions={[
    { value: 'registrationNumber', label: 'По номеру' },
    { value: 'aircraftType', label: 'По типу' },
  ]}
  presets={[
    { name: 'Активные ВС', filters: { status: ['active'] } },
    { name: 'Требуют внимания', filters: { status: ['maintenance'] } },
  ]}
/>
```

**Функции:**
- Фильтры по статусу, организации, типу
- Фильтры по дате (диапазон)
- Множественная сортировка
- Быстрые фильтры (presets)
- Сохранение фильтров в URL
- Сброс фильтров

---

## Пагинация

### Компонент Pagination

Компонент для отображения пагинации с навигацией по страницам.

**Использование:**

```tsx
import Pagination from '@/components/Pagination';

<Pagination
  total={totalItems}
  limit={20}
  currentPage={currentPage}
  onPageChange={(page) => setPage(page)}
/>
```

**Функции:**
- Навигация по страницам
- Показ диапазона записей
- Адаптивное отображение номеров страниц
- Интеграция с URL параметрами

---

## Хуки

### useUrlParams

Хук для работы с URL параметрами (фильтры, сортировка, пагинация).

```tsx
import { useUrlParams } from '@/hooks/useUrlParams';

const { params, setFilters, setSort, setPage, clearFilters } = useUrlParams();

// Установка фильтров
setFilters({ status: ['active'], organization: 'org-1' });

// Установка сортировки
setSort('registrationNumber', 'asc');

// Установка страницы
setPage(2);

// Очистка фильтров
clearFilters();
```

### usePagination

Хук для пагинации данных.

```tsx
import { usePagination } from '@/hooks/usePagination';

const { data, pagination } = usePagination(allData, {
  page: 1,
  limit: 20,
  total: allData.length,
});

// pagination содержит:
// - page: текущая страница
// - limit: записей на странице
// - total: всего записей
// - totalPages: всего страниц
// - hasNext: есть ли следующая страница
// - hasPrev: есть ли предыдущая страница
```

### useInfiniteScroll

Хук для бесконечной прокрутки.

```tsx
import { useInfiniteScroll } from '@/hooks/usePagination';

const { visibleData, loadMore, hasMore, reset } = useInfiniteScroll(data, 20);

// visibleData - видимые данные
// loadMore() - загрузить еще
// hasMore - есть ли еще данные
// reset() - сбросить
```

### useSearchHistory

Хук для сохранения истории поисков.

```tsx
import { useSearchHistory } from '@/hooks/useSearchHistory';

const { history, addToHistory, clearHistory, removeFromHistory } = useSearchHistory();

// Добавить в историю
addToHistory('поисковый запрос', 10);

// Очистить историю
clearHistory();

// Удалить из истории
removeFromHistory('поисковый запрос');
```

---

## Виртуализация списков

### Компонент VirtualizedList

Компонент для виртуализации больших списков с использованием `react-window`.

**Использование:**

```tsx
import VirtualizedList from '@/components/VirtualizedList';

<VirtualizedList
  items={largeDataArray}
  height={600}
  itemHeight={50}
  renderItem={({ index, style, data }) => (
    <div style={style}>
      {/* Рендер элемента */}
    </div>
  )}
/>
```

---

## Утилиты фильтрации и сортировки

### filterAndSort

Утилита для комбинированной фильтрации и сортировки.

```tsx
import { filterAndSort, FilterConfig, SortConfig } from '@/lib/utils/filter-and-sort';

const filters: FilterConfig[] = [
  { field: 'status', value: 'active', operator: 'equals' },
  { field: 'operator', value: 'search', operator: 'contains' },
];

const sortConfig: SortConfig = {
  field: 'registrationNumber',
  order: 'asc',
};

const filteredAndSorted = filterAndSort(data, filters, sortConfig);
```

**Операторы фильтров:**
- `equals` - точное совпадение
- `contains` - содержит подстроку
- `gt` - больше
- `lt` - меньше
- `gte` - больше или равно
- `lte` - меньше или равно
- `in` - входит в массив

---

## Пример полной интеграции

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useUrlParams } from '@/hooks/useUrlParams';
import { usePagination } from '@/hooks/usePagination';
import { filterAndSort, FilterConfig, SortConfig } from '@/lib/utils/filter-and-sort';
import FilterPanel from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';

export default function DataPage() {
  const [data, setData] = useState([]);
  const { params } = useUrlParams();
  
  // Применяем фильтры и сортировку
  const filters: FilterConfig[] = [];
  if (params.status) {
    filters.push({ field: 'status', value: params.status, operator: 'in' });
  }
  if (params.organization) {
    filters.push({ field: 'operator', value: params.organization, operator: 'equals' });
  }
  
  const sortConfig: SortConfig | undefined = params.sortBy
    ? { field: params.sortBy, order: params.sortOrder || 'asc' }
    : undefined;
  
  const filteredData = filterAndSort(data, filters, sortConfig);
  
  // Применяем пагинацию
  const { data: paginatedData, pagination } = usePagination(filteredData, {
    page: params.page || 1,
    limit: params.limit || 20,
    total: filteredData.length,
  });

  return (
    <div>
      <FilterPanel
        filters={{
          status: [
            { value: 'active', label: 'Активные' },
            { value: 'maintenance', label: 'На обслуживании' },
          ],
        }}
        sortOptions={[
          { value: 'registrationNumber', label: 'По номеру' },
        ]}
      />
      
      {/* Список данных */}
      <div>
        {paginatedData.map((item) => (
          <div key={item.id}>{/* Рендер элемента */}</div>
        ))}
      </div>
      
      <Pagination
        total={pagination.total}
        limit={pagination.limit}
        currentPage={pagination.page}
      />
    </div>
  );
}
```

---

**Дата создания:** 2025-01-22  
**Версия:** 1.0
