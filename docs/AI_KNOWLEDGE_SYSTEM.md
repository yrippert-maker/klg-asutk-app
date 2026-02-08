# AI-Powered Knowledge System

## Обзор

Система знаний на основе ИИ для автоматического извлечения, хранения и поиска информации из документов и данных.

## Возможности

### 1. Извлечение знаний из документов
- Автоматическое извлечение структурированной информации из PDF, DOCX, TXT, CSV
- Распознавание сущностей: воздушные суда, риски, нормативы, инсайты
- Генерация embeddings для семантического поиска

### 2. Семантический поиск
- Векторный поиск по сходству (cosine similarity)
- Поиск по типам сущностей
- Фильтрация по метаданным
- Порог релевантности

### 3. Генерация инсайтов
- Автоматический анализ данных
- Выявление паттернов и трендов
- Предсказание потенциальных проблем
- Рекомендации на основе данных

### 4. Интеллектуальные рекомендации
- Персонализированные рекомендации для пользователей
- Рекомендации на основе паттернов
- Приоритизация по важности
- Конкретные действия

### 5. Автоматическое обогащение данных
- Добавление связанных нормативов
- Исторический контекст
- Потенциальные риски
- Рекомендации

## API Endpoints

### POST `/api/knowledge/extract`
Извлечение знаний из документа.

**Request:**
```json
{
  "document": "текст документа",
  "type": "document",
  "metadata": {
    "source": "источник",
    "date": "2024-01-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "entities": [
    {
      "id": "kb-123",
      "type": "aircraft",
      "content": "извлеченная информация",
      "metadata": {
        "confidence": 0.9
      }
    }
  ],
  "count": 1
}
```

### POST `/api/knowledge/search`
Семантический поиск по базе знаний.

**Request:**
```json
{
  "query": "поисковый запрос",
  "type": "aircraft",
  "limit": 10,
  "threshold": 0.7,
  "filters": {
    "status": "active"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "kb-123",
      "content": "найденный контент",
      "metadata": {},
      "type": "aircraft",
      "similarity": 0.85
    }
  ],
  "total": 1
}
```

### POST `/api/knowledge/insights`
Генерация инсайтов из данных.

**Request:**
```json
{
  "data": [...],
  "context": "контекст анализа"
}
```

**Response:**
```json
{
  "insights": [
    {
      "id": "insight-123",
      "content": "описание инсайта",
      "metadata": {
        "category": "trend",
        "severity": "high",
        "confidence": 0.8
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST `/api/knowledge/recommendations`
Генерация рекомендаций.

**Request:**
```json
{
  "aircraft": [...],
  "risks": [...],
  "audits": [...],
  "personalized": true,
  "userId": "user-123",
  "userRole": "operator"
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec-123",
      "type": "action",
      "title": "Рекомендация",
      "description": "описание",
      "priority": "high",
      "confidence": 0.8,
      "suggestedActions": ["действие 1"],
      "reasoning": "обоснование"
    }
  ],
  "count": 1
}
```

### POST `/api/knowledge/enrich`
Обогащение данных знаниями.

**Request:**
```json
{
  "entity": {...},
  "type": "aircraft"
}
```

**Response:**
```json
{
  "enriched": {
    ...обогащенные данные,
    "relatedRegulations": [...],
    "historicalContext": "...",
    "recommendations": [...],
    "potentialRisks": [...]
  },
  "original": {...}
}
```

## Компоненты

### `KnowledgePanel`
Панель с инсайтами и рекомендациями для сущности.

```tsx
<KnowledgePanel
  entityId="aircraft-123"
  entityType="aircraft"
  onInsightClick={(insight) => console.log(insight)}
/>
```

### `SemanticSearch`
Компонент семантического поиска.

```tsx
<SemanticSearch
  onResultSelect={(result) => console.log(result)}
  placeholder="Поиск..."
/>
```

## Векторное хранилище

Система использует PostgreSQL с расширением `pgvector` для хранения embeddings.

### Инициализация

```typescript
import { initVectorStore } from '@/lib/ai/vector-store';

await initVectorStore();
```

### Сохранение документа

```typescript
import { storeVectorDocument } from '@/lib/ai/vector-store';

await storeVectorDocument(
  'doc-123',
  'содержимое документа',
  { source: 'manual' },
  'document'
);
```

## Автоматическое обогащение

Система автоматически обогащает данные при создании/обновлении:

```typescript
import { autoEnrichAircraft } from '@/lib/ai/auto-enrichment';

const enriched = await autoEnrichAircraft(aircraft);
```

## Настройка

### Переменные окружения

```env
OPENAI_API_KEY=your-api-key
```

### Установка pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Использование

1. **Извлечение знаний из документов:**
   - Загрузите документ через AI Agent
   - Система автоматически извлечет знания
   - Данные сохранятся в векторное хранилище

2. **Семантический поиск:**
   - Используйте компонент `SemanticSearch`
   - Или API endpoint `/api/knowledge/search`

3. **Получение инсайтов:**
   - Используйте компонент `KnowledgePanel`
   - Или API endpoint `/api/knowledge/insights`

4. **Рекомендации:**
   - Система автоматически генерирует рекомендации
   - Используйте API endpoint `/api/knowledge/recommendations`

## Архитектура

```
┌─────────────────┐
│   Documents     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Knowledge       │
│ Extraction      │
│ (OpenAI GPT-4)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embeddings      │
│ Generation      │
│ (text-embedding)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vector Store    │
│ (PostgreSQL +   │
│  pgvector)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Semantic Search │
│ & Insights      │
└─────────────────┘
```

## Производительность

- Embeddings генерируются асинхронно
- Векторный поиск оптимизирован через индексы
- Кэширование результатов поиска
- Fallback на текстовый поиск при недоступности pgvector

## Безопасность

- Rate limiting на всех endpoints
- Валидация входных данных
- Обработка ошибок
- Логирование действий
