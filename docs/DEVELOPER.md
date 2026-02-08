# Руководство для разработчиков

## Начало работы

### Требования
- Node.js 20+
- npm или yarn
- Git

### Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd klg_asutk_app

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env.local

# Запуск в режиме разработки
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

## Структура проекта

```
klg_asutk_app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Страницы
│   └── ...
├── components/            # React компоненты
├── lib/                   # Утилиты и helpers
│   ├── validation.ts     # Схемы валидации (Zod)
│   ├── logger.ts         # Логирование (Winston)
│   ├── error-handler.ts  # Обработка ошибок
│   ├── sanitize.ts       # Санитизация данных
│   └── ...
├── __tests__/            # Unit и Integration тесты
├── e2e/                  # E2E тесты (Playwright)
├── docs/                 # Документация
└── scripts/              # Скрипты
```

## Разработка

### Создание нового API endpoint

1. Создайте файл в `app/api/[route]/route.ts`
2. Используйте валидацию из `lib/validation.ts`
3. Используйте обработку ошибок из `lib/error-handler.ts`
4. Добавьте логирование через `lib/logger.ts`

Пример:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { aircraftSchema } from '@/lib/validation';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { logAudit } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const limitCheck = rateLimit(identifier, 100, 60000);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    // Валидация
    const body = await request.json();
    const validated = aircraftSchema.parse(body);
    
    // Логирование
    logAudit('CREATE_AIRCRAFT', 'aircraft', { identifier });
    
    // Обработка
    // ...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, { path: '/api/aircraft', method: 'POST' });
  }
}
```

### Создание нового компонента

1. Создайте файл в `components/[ComponentName].tsx`
2. Используйте TypeScript для типизации
3. Добавьте обработку ошибок
4. Используйте SWR для загрузки данных

Пример:
```typescript
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';

export default function AircraftList() {
  const { data, error, isLoading } = useSWR('/api/aircraft', fetcher);
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return (
    <div>
      {data?.map(aircraft => (
        <div key={aircraft.id}>{aircraft.registrationNumber}</div>
      ))}
    </div>
  );
}
```

## Тестирование

### Unit тесты

```bash
npm run test:unit
```

Тесты находятся в `__tests__/` и используют Jest.

### Integration тесты

```bash
npm run test:integration
```

Тесты API endpoints.

### E2E тесты

```bash
npm run test:e2e
```

Тесты с использованием Playwright.

### Запуск всех тестов

```bash
npm test
```

## Линтинг и форматирование

```bash
# Проверка линтера
npm run lint

# Автоисправление
npm run lint -- --fix

# Форматирование кода
npm run format

# Проверка форматирования
npm run format:check
```

## Переменные окружения

Создайте файл `.env.local`:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_USE_REGISTRY_DATA=true

# OpenAI
OPENAI_API_KEY=your-api-key

# Логирование
LOG_LEVEL=info
NODE_ENV=development
```

## Git Workflow

1. Создайте ветку от `develop`: `git checkout -b feature/your-feature`
2. Внесите изменения
3. Напишите тесты
4. Убедитесь, что все тесты проходят
5. Создайте Pull Request

## Code Review

Все изменения должны пройти code review перед мерджем в `main` или `develop`.

Проверяйте:
- Соответствие стилю кода
- Наличие тестов
- Обработку ошибок
- Безопасность
- Производительность

## Деплой

### Staging

Автоматический деплой при пуше в `develop` ветку.

### Production

Автоматический деплой при пуше в `main` ветку после успешного прохождения всех тестов.

## Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [SWR Documentation](https://swr.vercel.app/)
