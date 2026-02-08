# Документация по обработке ошибок

## Архитектура обработки ошибок

Система использует многоуровневую обработку ошибок:

1. **Error Boundary** - для ошибок React компонентов
2. **API Error Handler** - для ошибок API routes
3. **User-Friendly Messages** - понятные сообщения для пользователей
4. **Sentry Integration** - мониторинг критических ошибок
5. **Logging** - логирование всех ошибок

---

## Error Boundary

### Использование

Error Boundary автоматически обернут вокруг всего приложения в `app/layout.tsx`.

Для обертки отдельных компонентов:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary
      fallback={<div>Произошла ошибка</div>}
      onError={(error, errorInfo) => {
        console.error('Component error:', error);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Кастомный fallback

```typescript
<ErrorBoundary
  fallback={
    <div>
      <h2>Ошибка в компоненте</h2>
      <button onClick={() => window.location.reload()}>
        Обновить страницу
      </button>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

---

## API Error Handler

### Использование в API routes

```typescript
import { handleError, AppError, Errors } from '@/lib/error-handler';

export async function POST(request: Request) {
  try {
    // Ваш код
    if (!authorized) {
      throw Errors.UNAUTHORIZED;
    }
  } catch (error) {
    return handleError(error, {
      path: '/api/endpoint',
      method: 'POST',
      userId: 'user-id',
    });
  }
}
```

### Создание кастомных ошибок

```typescript
throw new AppError(
  'Сообщение об ошибке',
  'ERROR_CODE',
  400,
  { additional: 'data' }
);
```

---

## Понятные сообщения для пользователей

### Автоматическое преобразование

Система автоматически преобразует технические ошибки в понятные сообщения:

```typescript
import { getUserFriendlyError } from '@/lib/errors/user-friendly-messages';

try {
  // Код, который может выбросить ошибку
} catch (error) {
  const friendly = getUserFriendlyError(error);
  // friendly.title - заголовок
  // friendly.message - понятное сообщение
  // friendly.type - тип (error/warning/info)
  // friendly.action - рекомендуемое действие
}
```

### С контекстом

```typescript
import { getContextualErrorMessage } from '@/lib/errors/user-friendly-messages';

const friendly = getContextualErrorMessage(error, {
  action: 'сохранении данных',
  resource: 'воздушное судно',
  operation: 'create',
});
```

---

## Компоненты для отображения ошибок

### ErrorDisplay

```typescript
import ErrorDisplay from '@/components/ErrorDisplay';

<ErrorDisplay
  title="Ошибка загрузки"
  message="Не удалось загрузить данные"
  type="error"
  onRetry={() => refetch()}
  onClose={() => setError(null)}
  showDetails={true}
  details={error.stack}
/>
```

### ErrorAlert (улучшенный)

```typescript
import ErrorAlert from '@/components/ErrorAlert';

<ErrorAlert
  message="Ошибка"
  error={error} // Автоматически преобразуется в понятное сообщение
  onRetry={() => retry()}
  onClose={() => clearError()}
/>
```

---

## Хук useErrorHandler

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { error, userFriendlyError, handleError, clearError, hasError } = useErrorHandler({
    onError: (error) => {
      // Дополнительная обработка
    },
    logError: true,
    sendToSentry: true,
  });

  const fetchData = async () => {
    try {
      // Загрузка данных
    } catch (err) {
      handleError(err, {
        action: 'загрузке данных',
        resource: 'воздушные суда',
      });
    }
  };

  if (hasError && userFriendlyError) {
    return (
      <ErrorDisplay
        title={userFriendlyError.title}
        message={userFriendlyError.message}
        type={userFriendlyError.type}
        onRetry={fetchData}
      />
    );
  }

  return <div>...</div>;
}
```

---

## Интеграция с Sentry

### Настройка

1. Создайте аккаунт на [sentry.io](https://sentry.io)
2. Создайте проект и получите DSN
3. Добавьте в `.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   ```

### Использование

```typescript
import { captureException, captureMessage, setUserContext } from '@/lib/monitoring/sentry';

// Отправка исключения
try {
  // Код
} catch (error) {
  captureException(error, {
    component: 'MyComponent',
    action: 'fetchData',
  });
}

// Отправка сообщения
captureMessage('Важное событие', 'warning', {
  userId: '123',
});

// Установка контекста пользователя
setUserContext('user-id', 'user@example.com', 'username');
```

### Автоматическая отправка

Критические ошибки автоматически отправляются в Sentry:
- Ошибки базы данных
- Ошибки подключения
- Ошибки таймаута
- Ошибки 500+

---

## Логирование ошибок

Все ошибки логируются через Winston:

```typescript
import { logError, logSecurity, logAudit } from '@/lib/logger';

// Обычная ошибка
logError('Ошибка загрузки данных', error, {
  userId: '123',
  component: 'AircraftList',
});

// Ошибка безопасности
logSecurity('Попытка несанкционированного доступа', {
  ip: '192.168.1.1',
  path: '/api/admin',
});

// Аудит
logAudit('CREATE_AIRCRAFT', 'aircraft', {
  userId: '123',
  aircraftId: 'RA-12345',
});
```

Логи сохраняются в:
- `logs/error.log` - только ошибки
- `logs/combined.log` - все логи

---

## Коды ошибок

Используйте предопределенные коды ошибок:

```typescript
import { ErrorCode } from '@/lib/errors/error-codes';

throw new AppError('Сообщение', ErrorCode.NETWORK_ERROR, 500);
```

Доступные коды:
- `NETWORK_ERROR` - ошибка сети
- `VALIDATION_ERROR` - ошибка валидации
- `UNAUTHORIZED` - не авторизован
- `FORBIDDEN` - доступ запрещен
- `NOT_FOUND` - не найдено
- `DATABASE_ERROR` - ошибка БД
- `RATE_LIMIT_EXCEEDED` - превышен лимит
- И другие...

---

## Best Practices

1. **Всегда обрабатывайте ошибки** - используйте try/catch
2. **Логируйте с контекстом** - добавляйте информацию о действии
3. **Показывайте понятные сообщения** - используйте `getUserFriendlyError`
4. **Используйте Error Boundary** - для изоляции ошибок компонентов
5. **Отправляйте критические ошибки в Sentry** - для мониторинга
6. **Не показывайте технические детали** - только в режиме разработки

---

## Примеры

### Полный пример компонента с обработкой ошибок

```typescript
'use client';

import { useState } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorDisplay from '@/components/ErrorDisplay';
import { aircraftApi } from '@/lib/api';

export default function AircraftList() {
  const { error, userFriendlyError, handleError, clearError, hasError } = useErrorHandler();
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAircraft = async () => {
    try {
      setLoading(true);
      clearError();
      const data = await aircraftApi.getAircraft();
      setAircraft(data);
    } catch (err) {
      handleError(err, {
        action: 'загрузке списка воздушных судов',
        resource: 'aircraft',
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasError && userFriendlyError) {
    return (
      <ErrorDisplay
        title={userFriendlyError.title}
        message={userFriendlyError.message}
        type={userFriendlyError.type}
        onRetry={fetchAircraft}
      />
    );
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {aircraft.map(a => <div key={a.id}>{a.registrationNumber}</div>)}
    </div>
  );
}
```

---

**Дата создания:** 2025-01-21  
**Версия:** 1.0
