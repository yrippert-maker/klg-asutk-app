# КЛГ АСУ ТК — Руководство по demo-развёртыванию

## Требования

- Docker 24+ и Docker Compose v2
- 4 GB RAM, 10 GB диска
- Для удалённого доступа: открытые порты 80, 443 (или 3000, 8000 для localhost)

## Варианты хостинга

### Вариант 1: VPS/VDS (рекомендуется для demo)

Минимальный VPS: 2 vCPU, 4 GB RAM, Ubuntu 22/24.
Подходят: Timeweb Cloud, Selectel, Yandex Cloud, Hetzner.

```bash
# На сервере:
git clone https://github.com/yrippert-maker/klg-asutk-app.git
cd klg-asutk-app
bash demo/deploy.sh --domain demo.klg.refly.ru
```

DNS: создайте A-запись `demo.klg.refly.ru → IP_вашего_сервера`.
Caddy автоматически получит сертификат Let's Encrypt.

### Вариант 2: Локальный сервер + туннель

Если нет VPS — используйте Cloudflare Tunnel (бесплатно, стабильно):

```bash
# 1. Запуск без домена
bash demo/deploy.sh

# 2. Установка cloudflared
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# 3. Быстрый туннель (без регистрации)
cloudflared tunnel --url http://localhost:3000
# → Даёт временный URL вида https://xxx-yyy-zzz.trycloudflare.com
```

Альтернатива: `ngrok http 3000` (бесплатный план — 1 туннель).

### Вариант 3: Yandex Cloud / Selectel

```bash
# Создайте VM: Ubuntu 22.04, 2 vCPU, 4 GB RAM
# Установите Docker:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Далее как VPS:
git clone ... && cd klg-asutk-app
bash demo/deploy.sh --domain your-domain.ru
```

## Авторизация

### Режим 1: Dev-токены (по умолчанию)

Для каждого demo-пользователя генерируется JWT-токен со сроком 30 дней.

```bash
# Генерация токенов
python3 demo/generate_tokens.py

# Использование в curl
curl -H "Authorization: Bearer <TOKEN>" https://demo.klg.refly.ru/api/v1/aircraft
```

Во frontend используйте страницу `/login` → введите токен из `demo/tokens.json`.

### Режим 2: Keycloak (полноценная авторизация)

Keycloak уже входит в базовый `docker-compose.yml`. При запуске с Caddy (profile demo) доступен по `https://<домен>/auth`.

```bash
bash demo/deploy.sh --domain demo.klg.refly.ru --with-keycloak
```

Keycloak: `https://demo.klg.refly.ru/auth`  
Admin: `admin` / `<из .env: KC_ADMIN_PASSWORD>`

После запуска нужно создать realm `klg` и 5 пользователей вручную или через import.

## 5 тестовых пользователей

| # | Имя | Роль | Организация | Что доступно |
|---|-----|------|-------------|--------------|
| 1 | Админ Системы | admin | — | Всё |
| 2 | Иванов И.П. | authority_inspector | ФАВТ | Инспекция, заявки, аудиты, панель ФАВТ |
| 3 | Петров А.С. | operator_manager | КалинингрАвиа | Парк ВС, заявки, модификации |
| 4 | Сидоров В.Н. | mro_manager | Балтик Техник | Наряды ТО, чек-листы, CRS |
| 5 | Козлова Е.А. | operator_user | КалинингрАвиа | Просмотр ВС, заявки (read) |

## Демо-сценарии

### Сценарий 1: Процесс сертификации
1. **Козлова** (operator_user) → Просмотр заявки KLG-...-0002
2. **Петров** (operator_manager) → Редактирование и подача заявки
3. **Иванов** (authority_inspector) → Начало рассмотрения → Замечания → Одобрение/отклонение

### Сценарий 2: Управление парком ВС
1. **Петров** → Просмотр 4 ВС, фильтрация по статусу
2. **Сидоров** (mro_manager) → Создание наряда на ТО для RA-73001 (maintenance)
3. **Иванов** → Аудит ВС, чек-лист по ФАП-148

### Сценарий 3: Мониторинг рисков
1. **Админ** → Dashboard, статистика, risk alerts
2. **Иванов** → Панель ФАВТ (read-only), нормативная база

## Остановка

```bash
docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo down
# С удалением данных:
docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo down -v
```
