# Документация по экспорту данных и клавиатурным сокращениям

## Экспорт данных

### Поддерживаемые форматы

1. **Excel (.xlsx)** - через библиотеку `xlsx`
2. **CSV** - текстовый формат с разделителями
3. **PDF** - для отчетов через `jspdf` и `jspdf-autotable`
4. **JSON** - для разработчиков

### Использование

#### Экспорт в Excel

```typescript
import { exportToExcel } from '@/lib/export';

exportToExcel(data, {
  filename: 'aircraft-export',
  sheetName: 'Воздушные суда',
  headers: ['Регистрационный номер', 'Тип ВС', 'Оператор'],
  columns: ['registrationNumber', 'aircraftType', 'operator'],
});
```

#### Экспорт в CSV

```typescript
import { exportToCSV } from '@/lib/export';

exportToCSV(data, {
  filename: 'aircraft-export',
  headers: ['Регистрационный номер', 'Тип ВС'],
  columns: ['registrationNumber', 'aircraftType'],
  delimiter: ',',
});
```

#### Экспорт в PDF

```typescript
import { exportToPDF } from '@/lib/export';

exportToPDF(data, {
  filename: 'aircraft-report',
  title: 'Отчет по воздушным судам',
  headers: ['Регистрационный номер', 'Тип ВС'],
  columns: ['registrationNumber', 'aircraftType'],
  orientation: 'portrait',
});
```

#### Экспорт в JSON

```typescript
import { exportToJSON } from '@/lib/export';

exportToJSON(data, {
  filename: 'aircraft-data',
  pretty: true,
});
```

### Компонент ExportModal

Модальное окно для экспорта с выбором формата и колонок:

```tsx
<ExportModal
  isOpen={isExportModalOpen}
  onClose={() => setIsExportModalOpen(false)}
  data={aircraft}
  filename="aircraft-export"
  title="Экспорт воздушных судов"
  availableColumns={Object.keys(aircraft[0])}
  columnLabels={{
    registrationNumber: 'Регистрационный номер',
    aircraftType: 'Тип ВС',
  }}
/>
```

---

## Сохранение состояния

### useLocalStorage

Базовый хук для работы с localStorage:

```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage';

const [value, setValue] = useLocalStorage('key', initialValue);
```

### useFilters

Хук для сохранения фильтров:

```typescript
import { useFilters } from '@/hooks/useLocalStorage';

const [filters, setFilters, resetFilters] = useFilters('dashboardFilters', {
  search: '',
  status: 'all',
});
```

### useUserSettings

Хук для настроек пользователя:

```typescript
import { useUserSettings } from '@/hooks/useLocalStorage';

const { theme, setTheme, language, setLanguage } = useUserSettings();
```

### useFavorites

Хук для избранного:

```typescript
import { useFavorites } from '@/hooks/useLocalStorage';

const { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite } = useFavorites();
```

### useLastVisited

Хук для последних посещенных страниц:

```typescript
import { useLastVisited } from '@/hooks/useLocalStorage';

const { lastVisited, addVisited } = useLastVisited();
```

---

## Клавиатурные сокращения

### Глобальные горячие клавиши

- **Ctrl+K** (или Cmd+K на Mac) - Глобальный поиск
- **Ctrl+N** (или Cmd+N на Mac) - Создать новую запись
- **Ctrl+S** (или Cmd+S на Mac) - Сохранить форму
- **Esc** - Закрыть модальное окно

### Использование

#### useGlobalShortcuts

```typescript
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';

useGlobalShortcuts({
  onSearch: () => setIsSearchModalOpen(true),
  onCreateNew: () => router.push('/aircraft'),
  onSave: () => handleSave(),
  onClose: () => setIsModalOpen(false),
});
```

#### useKeyboardShortcuts

Для кастомных горячих клавиш:

```typescript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

useKeyboardShortcuts([
  {
    key: 'k',
    ctrl: true,
    handler: () => console.log('Ctrl+K pressed'),
    description: 'Глобальный поиск',
  },
]);
```

### Показ подсказок

Компонент для отображения подсказок по горячим клавишам:

```tsx
import { KeyboardShortcutsHelp, useShortcutsHelp } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  const { showHelp, setShowHelp } = useShortcutsHelp();
  
  return (
    <>
      {showHelp && <KeyboardShortcutsHelp />}
      <button onClick={() => setShowHelp(true)}>Показать горячие клавиши</button>
    </>
  );
}
```

Нажмите **Ctrl+?** (или Cmd+? на Mac) для показа/скрытия подсказок.

---

## Примеры использования

### Экспорт с фильтрами

```typescript
const [filters] = useFilters('aircraftFilters', { status: 'all' });

const filteredData = aircraft.filter(a => {
  if (filters.status !== 'all') {
    return a.status === filters.status;
  }
  return true;
});

exportToExcel(filteredData, { filename: 'filtered-aircraft' });
```

### Сохранение состояния формы

```typescript
const [formData, setFormData] = useLocalStorage('aircraftForm', {
  registrationNumber: '',
  aircraftType: '',
});
```

### Избранное

```typescript
const { isFavorite, toggleFavorite } = useFavorites<Aircraft>();

<button onClick={() => toggleFavorite(aircraft)}>
  {isFavorite(aircraft.id) ? '★' : '☆'}
</button>
```

---

**Дата создания:** 2025-01-22  
**Версия:** 1.0
