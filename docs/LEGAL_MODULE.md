# Модуль анализа и подготовки юридических документов

Система с **мультиагентной ИИ-архитектурой** для анализа, подготовки в соответствии с нормами законодательства разных стран документов (законодательных, рекомендательных, директивных, уведомительных и т.д.), перекрёстных ссылок на цитируемые документы, правовых комментариев и судебной практики.

## Компоненты

### Модели БД

| Таблица | Описание |
|--------|----------|
| `legal_jurisdictions` | Юрисдикции (RU, KZ, EU, US, ICAO, EASA и др.) |
| `legal_documents` | Документы: законодательные, рекомендательные, директивные, уведомительные, нормативные, договорные, судебные |
| `legal_cross_references` | Перекрёстные ссылки между цитируемыми документами |
| `legal_comments` | Правовые комментарии для использования в базе |
| `legal_judicial_practices` | Судебная практика (решения, определения) |

### Типы документов (`document_type`)

- `legislative` — законодательный (закон, кодекс)
- `recommendatory` — рекомендательный
- `directive` — директивный
- `notification` — уведомительный
- `regulatory` — нормативно-правовой (приказы, постановления)
- `contractual` — договорной
- `judicial` — судебный акт
- `other` — иное

### ИИ-агенты

1. **DocumentClassifierAgent** — классификация типа документа
2. **NormComplianceAgent** — проверка соответствия нормам юрисдикции
3. **CrossReferenceAgent** — поиск и добавление перекрёстных ссылок на цитируемые документы
4. **CommentEnrichmentAgent** — подбор правовых комментариев из базы
5. **JudicialPracticeAgent** — подбор судебной практики из базы
6. **FormattingAgent** — рекомендации по структуре и оформлению по требованиям юрисдикции

Оркестратор **LegalAnalysisOrchestrator** запускает агентов, при необходимости сохраняет перекрёстные ссылки в БД и обновляет документ (`analysis_json`, `compliance_notes`).

## API (префикс `/api/v1/legal`)

### Юрисдикции

- `GET /legal/jurisdictions` — список
- `POST /legal/jurisdictions` — создание (admin)
- `GET /legal/jurisdictions/{id}` — одна
- `PATCH /legal/jurisdictions/{id}` — обновление (admin)

### Документы

- `GET /legal/documents?jurisdiction_id=&document_type=&limit=` — список
- `POST /legal/documents` — создание
- `GET /legal/documents/{id}` — одна
- `PATCH /legal/documents/{id}` — обновление
- `GET /legal/documents/{id}/cross-references?direction=outgoing|incoming` — перекрёстные ссылки

### Перекрёстные ссылки

- `POST /legal/cross-references` — ручное добавление ссылки

### Правовые комментарии

- `GET /legal/comments?jurisdiction_id=&document_id=` — список
- `POST /legal/comments` — создание
- `PATCH /legal/comments/{id}` — обновление

### Судебная практика

- `GET /legal/judicial-practices?jurisdiction_id=&document_id=` — список
- `POST /legal/judicial-practices` — создание
- `PATCH /legal/judicial-practices/{id}` — обновление

### ИИ-анализ

- `POST /legal/analyze` — анализ по переданным `jurisdiction_id`, `title`, `content` (и опционально `document_id`). Тело:
  ```json
  {
    "document_id": "uuid или null",
    "jurisdiction_id": "uuid",
    "title": "Название документа",
    "content": "Текст или фрагмент",
    "skip_agents": ["classifier", "formatting"],
    "save_cross_references": true
  }
  ```
- `POST /legal/documents/{id}/analyze?skip_agents=&save_cross_references=` — анализ существующего документа по id

## Настройка LLM

В `.env` или переменных окружения:

- `OPENAI_API_KEY` — ключ OpenAI (или аналог)
- `OPENAI_BASE_URL` — базовый URL для локальных OpenAI-совместимых моделей
- `LEGAL_LLM_MODEL` — модель (по умолчанию `gpt-4o-mini`)

В `app.core.config` добавлены: `openai_api_key`, `openai_base_url`, `legal_llm_model`.

Если LLM недоступен (нет ключа или ошибка), агенты работают в режиме заглушек (эвристики, пустые списки).

## Первичное заполнение

Юрисдикции (RU, KZ, BY, EU, US, US-CA, ICAO, EASA):

```bash
cd backend && python -m app.db.seed_legal
```

## Зависимости

- `openai>=1.0.0` — для вызова LLM (OpenAI-совместимый API).
