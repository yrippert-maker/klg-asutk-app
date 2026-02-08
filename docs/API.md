# API Документация

## Базовый URL
```
http://localhost:3000/api
```

## Аутентификация

> **Примечание:** Аутентификация будет реализована в будущих версиях. Сейчас все endpoints доступны без авторизации.

## Endpoints

### GET /api/aircraft

Получение списка воздушных судов.

**Ответ:**
```json
[
  {
    "id": "1",
    "registrationNumber": "RA-12345",
    "serialNumber": "SN-001",
    "aircraftType": "Boeing 737-800",
    "operator": "Аэрофлот",
    "status": "Активен",
    "flightHours": 12500
  }
]
```

### POST /api/ai-data

Получение данных для ИИ агента.

**Тело запроса:**
```json
{
  "dataType": "aircraft",
  "filters": {
    "registrationNumber": "RA-12345",
    "operator": "Аэрофлот"
  }
}
```

**Параметры:**
- `dataType` (string, required): Тип данных (`aircraft`, `risks`, `audits`, `organizations`, `checklists`, `applications`, `users`, `documents`, `regulations`, `all`)
- `filters` (object, optional): Фильтры для данных

**Ответ:**
```json
{
  "dataType": "aircraft",
  "count": 3,
  "data": [...]
}
```

### POST /api/ai-chat

Отправка сообщения ИИ агенту.

**Тело запроса:**
```json
{
  "message": "Сколько ВС у Аэрофлота?",
  "history": [
    {
      "role": "user",
      "content": "Привет"
    },
    {
      "role": "assistant",
      "content": "Привет! Чем могу помочь?"
    }
  ],
  "files": []
}
```

**Ответ:**
```json
{
  "response": "У Аэрофлота 150 воздушных судов.",
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

**Rate Limit:** 50 запросов в минуту

### GET /api/regulations

Получение нормативных документов.

**Query параметры:**
- `source` (string, optional): Фильтр по источнику (`ICAO`, `EASA`, `FAA`, `MAK`, `ARMAC`, `RUSSIAN_RULES`, `AIR_CODE`)
- `type` (string, optional): Фильтр по типу (`convention`, `annex`, `regulation`, `rule`, `code`)
- `search` (string, optional): Поисковый запрос

**Ответ:**
```json
{
  "documents": [
    {
      "id": "chicago-convention",
      "title": "Конвенция о международной гражданской авиации",
      "source": "ICAO",
      "type": "convention",
      "category": "Основополагающий документ",
      "version": "2024",
      "lastUpdated": "2025-01-21T00:00:00.000Z",
      "content": "...",
      "url": "https://www.icao.int/..."
    }
  ],
  "total": 19
}
```

### POST /api/regulations/update

Обновление нормативных документов (требует авторизации).

**Тело запроса:**
```json
{
  "source": "ICAO"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Нормативные документы успешно обновлены",
  "results": {
    "timestamp": "2025-01-21T10:00:00.000Z",
    "sources": [...]
  }
}
```

## Коды ошибок

- `400` - Неверный запрос (ошибка валидации)
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `429` - Превышен лимит запросов
- `500` - Внутренняя ошибка сервера

## Формат ошибки

```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Rate Limiting

- `/api/ai-chat`: 50 запросов в минуту
- `/api/ai-data`: 100 запросов в минуту
- Остальные endpoints: 200 запросов в минуту

При превышении лимита возвращается статус `429` с заголовками:
- `X-RateLimit-Limit`: Максимальное количество запросов
- `X-RateLimit-Remaining`: Оставшееся количество
- `X-RateLimit-Reset`: Время сброса лимита (timestamp)

## Валидация данных

Все входные данные валидируются с использованием Zod схем. При ошибке валидации возвращается статус `400` с деталями ошибок.

## Версионирование

Текущая версия API: `v1`

В будущем версионирование будет реализовано через префикс пути: `/api/v1/...`
