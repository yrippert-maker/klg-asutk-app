# Настройка прокси Anthropic через papa-app (Railway)

KLG backend в Yandex Cloud (РФ) не может вызывать Anthropic API из-за блокировки по IP.  
Запросы идут через papa-app на Railway (вне РФ).

## Что сделано в коде

- **papa-app:** `POST /api/proxy/anthropic` — принимает тело запроса и заголовок `x-proxy-secret`, подставляет `ANTHROPIC_API_KEY` и вызывает `https://api.anthropic.com/v1/messages`.
- **KLG backend:** при заданных `AI_PROXY_URL` и `AI_PROXY_SECRET` использует прокси вместо прямого вызова Anthropic.

## 1. Railway (papa-app)

В проекте papa-app в Railway Dashboard → Variables:

| Переменная | Значение | Секретность |
|------------|----------|-------------|
| `ANTHROPIC_API_KEY` | Ваш ключ Anthropic (sk-ant-...) | Secret |
| `PROXY_SECRET` | `klg-refly-proxy-2026` (или свой) | Secret |

После сохранения Railway пересоберёт и задеплоит приложение.

## 2. Сервер KLG (158.160.22.166)

```bash
cd ~/klg-asutk-app
git pull origin main

# Добавить в .env (если ещё не добавлено)
grep -q AI_PROXY_URL .env || echo 'AI_PROXY_URL=https://papa-app-production.up.railway.app/api/proxy/anthropic' >> .env
grep -q AI_PROXY_SECRET .env || echo 'AI_PROXY_SECRET=klg-refly-proxy-2026' >> .env

docker compose build backend && docker compose up -d backend
```

Значение `AI_PROXY_SECRET` должно совпадать с `PROXY_SECRET` в Railway.

## 3. Проверка

```bash
# Прокси (после деплоя papa-app и установки переменных)
curl -s -X POST https://papa-app-production.up.railway.app/api/proxy/anthropic \
  -H "Content-Type: application/json" \
  -H "x-proxy-secret: klg-refly-proxy-2026" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":50,"messages":[{"role":"user","content":"Hi"}]}'
```

Ожидается JSON с полем `content` (ответ модели) или сообщение об ошибке от Anthropic.  
401 — неверный `x-proxy-secret`, 500 — не задан `ANTHROPIC_API_KEY` в Railway.
