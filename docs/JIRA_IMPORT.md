# Импорт данных из Jira

## Описание

Система поддерживает импорт данных о задачах из Jira через CSV файлы, расположенные в папке `новая папка`.

## Поддерживаемые файлы

1. **REFLY_Jira_Backlog_Subtasks_Dependencies.csv** - основной файл с эпиками, историями и подзадачами
2. **REFLY_Jira_Issue_Links.csv** - связи между задачами (зависимости)
3. **report_audit_trail.csv** - история аудита и отчетов

## Структура данных

### Эпики (Epics)
- Issue Id
- Summary (название)
- Description (описание)
- Priority (приоритет)
- Components (компоненты)
- Labels (метки)

### Истории (User Stories)
- Issue Id
- Parent Id (ID эпика)
- Summary
- Description (включая Acceptance Criteria)
- Priority
- Story Points
- Components
- Labels

### Подзадачи (Sub-tasks)
- Issue Id
- Parent Id (ID истории)
- Summary
- Description
- Priority
- Components
- Labels

### Зависимости
- From Issue Id
- To Issue Id
- Link Type (Blocks, Depends, Relates)

## Использование

### 1. Импорт данных

```bash
npm run import:jira
```

Скрипт:
- Создаст необходимые таблицы в БД (если их нет)
- Импортирует эпики, истории и подзадачи
- Импортирует зависимости между задачами
- Импортирует данные audit trail

### 2. Просмотр данных

После импорта данные доступны через:
- **Веб-интерфейс**: `/jira-tasks`
- **API**: `GET /api/jira-tasks?type=epic|story|subtask|all`

### 3. API Endpoints

#### Получить все эпики с историями
```
GET /api/jira-tasks?type=epic
```

#### Получить все истории
```
GET /api/jira-tasks?type=story
```

#### Получить истории конкретного эпика
```
GET /api/jira-tasks?type=story&epic_id=1001
```

#### Получить подзадачи
```
GET /api/jira-tasks?type=subtask
```

#### Получить подзадачи конкретной истории
```
GET /api/jira-tasks?type=subtask&story_id=1011
```

#### Получить все данные
```
GET /api/jira-tasks?type=all
```

## Структура базы данных

### Таблицы

1. **jira_epics** - эпики
2. **jira_stories** - истории пользователей
3. **jira_subtasks** - подзадачи
4. **jira_task_dependencies** - зависимости между задачами

### Схема

См. файл `lib/database/jira_tasks_schema.sql`

## Примеры использования

### Получить все эпики с приоритетом High

```sql
SELECT * FROM jira_epics WHERE priority = 'High' ORDER BY created_at DESC;
```

### Получить все истории для эпика E1

```sql
SELECT * FROM jira_stories WHERE parent_epic_id = '1001' ORDER BY story_points DESC;
```

### Получить зависимости для задачи

```sql
SELECT * FROM jira_task_dependencies WHERE from_issue_id = '1011';
```

## Обновление данных

Для обновления данных просто запустите импорт снова:

```bash
npm run import:jira
```

Скрипт использует `ON CONFLICT DO UPDATE`, поэтому существующие записи будут обновлены, а новые - добавлены.

## Интеграция с системой

Импортированные данные можно использовать для:
- Отслеживания прогресса разработки
- Планирования спринтов
- Анализа зависимостей
- Генерации отчетов
- Управления рисками (связь с рисками через метки)
