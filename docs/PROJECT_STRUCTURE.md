# Структура проекта

## Основные директории

```
├── backend/           # Python API (FastAPI)
├── frontend/          # Next.js приложение
├── supabase/         # Supabase функции и миграции
├── scripts/          # Утилиты и скрипты
├── tools/            # Инструменты разработки
├── docs/             # Документация
└── utils/            # Общие утилиты
```

## Backend структура

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── legal/          # Legal модули (разбито на подмодули)
│   │       ├── regulator.py    # Регуляторные функции
│   │       └── personnel_plg.py # Персонал
│   └── core/           # Основная логика
└── requirements.txt    # Python зависимости
```

## Frontend структура

```
frontend/
├── components/        # React компоненты
├── pages/            # Next.js страницы
├── styles/           # CSS/стили
└── utils/            # Утилиты фронтенда
```

## Важные файлы

- `.env.example` - шаблон переменных окружения
- `.gitignore` - исключения для Git
- `utils/logger.js` - централизованное логгирование
- `tools/` - скрипты для разработки и деплоя