# Мониторинг production-окружения КЛГ АСУ ТК

Рекомендации по настройке мониторинга для промышленной эксплуатации.

---

## 1. Метрики Backend (Prometheus)

Backend отдаёт метрики в формате Prometheus на эндпоинте:

- **URL:** `GET /api/v1/metrics`
- **Формат:** text/plain (Prometheus exposition format)

### Метрики

| Метрика | Тип | Описание |
|---------|-----|----------|
| `klg_http_requests_total` | counter | Число запросов по method и path |
| `klg_http_request_duration_seconds` | counter | Сумма длительности запросов по method и path |
| `klg_http_errors_total` | counter | Ошибки по коду ответа (4xx, 5xx) |

### Пример конфигурации Prometheus (scrape)

Добавьте в `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'klg-backend'
    metrics_path: /api/v1/metrics
    static_configs:
      - targets: ['backend:8000']   # или host:port вашего backend
    scrape_interval: 15s
```

В Kubernetes используйте Service и при необходимости аннотации для Prometheus Operator.

---

## 2. Health Check

Используйте для проверки живости и готовности:

| Эндпоинт | Назначение |
|----------|------------|
| `GET /api/v1/health` | Общий статус: БД, Redis, risk_scanner, версия |
| `GET /api/v1/health/health/detailed` | Расширенная проверка: диск, память, счётчики данных |

Использование в Docker/Kubernetes:

- **livenessProbe:** `GET /api/v1/health` каждые 10–30 с.
- **readinessProbe:** тот же или `/api/v1/health` с проверкой `status == "healthy"` или `"ok"`.

Пример для Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 15
readinessProbe:
  httpGet:
    path: /api/v1/health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 3. Логирование

- **Backend:** Python `logging`; при деплое направляйте stdout/stderr в централизованную систему (например, Loki, CloudWatch, ELK).
- **Frontend:** ошибки можно отправлять в Sentry (`NEXT_PUBLIC_SENTRY_DSN`).
- Не логировать секреты и персональные данные в открытом виде.

---

## 4. Алертинг (рекомендуемые правила)

Настройте алерты в Prometheus/Alertmanager или аналоге.

| Алерт | Условие | Действие |
|-------|---------|----------|
| Backend down | `up{job="klg-backend"} == 0` | Уведомление on-call |
| Высокий % ошибок | `rate(klg_http_errors_total[5m]) / rate(klg_http_requests_total[5m]) > 0.05` | Разбор инцидента |
| Высокая задержка | Например, p99 latency по метрикам (если добавить histogram) | Деградация качества |
| Health degraded | Периодический probe к `/api/v1/health` возвращает `status != healthy` | Проверка БД/Redis |

---

## 5. Grafana (пример дашборда)

Импортируйте или создайте дашборд с панелями:

- **Requests:** `sum(rate(klg_http_requests_total[5m])) by (method, path)`.
- **Errors:** `sum(rate(klg_http_errors_total[5m])) by (status)`.
- **Health:** результат последнего запроса к `/api/v1/health` (через Blackbox exporter или скрипт).

Источник данных — Prometheus, указывающий на scrape целевого backend.

---

## 6. Docker Compose (локальный стек мониторинга)

Опционально для разработки/стенда можно добавить в `docker-compose`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    depends_on:
      - backend

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: "false"
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

Создайте `config/prometheus.yml` с job `klg-backend` по образцу из раздела 1.

---

## 7. Чек-лист перед production

- [ ] Prometheus собирает метрики с `/api/v1/metrics`.
- [ ] Liveness/readiness настроены на `/api/v1/health`.
- [ ] Логи backend и frontend попадают в централизованное хранилище.
- [ ] Настроены алерты на падение сервиса и рост ошибок.
- [ ] Контакты on-call заданы в Alertmanager/канале уведомлений.

---

© АО «REFLY» — Разработчик АСУ ТК КЛГ
