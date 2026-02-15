#!/usr/bin/env bash
# КЛГ АСУ ТК — Demo deployment
# Запуск: bash demo/deploy.sh [--domain demo.klg.refly.ru] [--with-keycloak]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

DOMAIN="${DEMO_DOMAIN:-localhost}"
WITH_KEYCLOAK=false
PROFILES="--profile demo"

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2 ;;
    --with-keycloak) WITH_KEYCLOAK=true; shift ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

if $WITH_KEYCLOAK; then
  PROFILES="$PROFILES --profile keycloak"
fi

echo "╔══════════════════════════════════════════════════════╗"
echo "║  КЛГ АСУ ТК — Demo Deployment                       ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Domain:   $DOMAIN"
echo "║  Keycloak: $WITH_KEYCLOAK"
echo "╚══════════════════════════════════════════════════════╝"

# 1. Генерируем .env если нет
if [ ! -f .env ]; then
  echo "Создаю .env..."
  SECRET_KEY=$(openssl rand -hex 32)
  JWT_SECRET=$(openssl rand -hex 32)
  DB_PASSWORD=$(openssl rand -hex 16)
  cat > .env <<EOF
# KLG Demo — автосгенерированный $(date -Iseconds)
SECRET_KEY=$SECRET_KEY
JWT_SECRET=$JWT_SECRET
DB_USER=klg
DB_PASSWORD=$DB_PASSWORD
DB_NAME=klg
DEMO_DOMAIN=$DOMAIN
ENABLE_DEV_AUTH=true
DEV_TOKEN=dev
CORS_ORIGINS=http://localhost:3000,https://$DOMAIN
MINIO_USER=minioadmin
MINIO_PASSWORD=$(openssl rand -hex 12)
KC_ADMIN_PASSWORD=$(openssl rand -hex 12)
KC_DB_PASSWORD=$(openssl rand -hex 12)
EOF
  echo "✅ .env создан (пароли сгенерированы)"
else
  echo "ℹ️  .env уже существует, пропускаю"
fi

# shellcheck source=/dev/null
source .env 2>/dev/null || true
export DEMO_DOMAIN="$DOMAIN"

# 2. Сборка и запуск
echo ""
echo "🔨 Сборка и запуск контейнеров..."
docker compose -f docker-compose.yml -f docker-compose.demo.yml $PROFILES build
docker compose -f docker-compose.yml -f docker-compose.demo.yml $PROFILES up -d

# 3. Ожидание готовности backend
echo ""
echo "⏳ Ожидание готовности сервисов..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend готов"
    break
  fi
  sleep 2
done

# 4. Seed demo данных
echo ""
echo "🌱 Загрузка demo-данных..."
docker compose -f docker-compose.yml -f docker-compose.demo.yml $PROFILES run --rm demo-seed || true

# 5. Генерация токенов
echo ""
echo "🔑 Генерация demo-токенов..."
pip install python-jose[cryptography] -q 2>/dev/null || true
export JWT_SECRET="${JWT_SECRET:-demo-secret-change-in-production-2026}"
python3 demo/generate_tokens.py --format table
python3 demo/generate_tokens.py --format json > demo/tokens.json 2>/dev/null || true

# 6. Итог
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ КЛГ АСУ ТК — Demo запущен!                      ║"
echo "╠══════════════════════════════════════════════════════╣"
if [ "$DOMAIN" = "localhost" ]; then
  echo "║  Frontend:  http://localhost:3000                    ║"
  echo "║  API:       http://localhost:8000/api/v1/health       ║"
  echo "║  Swagger:   http://localhost:8000/docs                ║"
else
  echo "║  Frontend:  https://$DOMAIN                          ║"
  echo "║  API:       https://$DOMAIN/api/v1/health            ║"
  echo "║  Swagger:   https://$DOMAIN/docs                     ║"
fi
if $WITH_KEYCLOAK; then
  echo "║  Keycloak:  https://$DOMAIN/auth (admin/см. .env)    ║"
fi
echo "║                                                      ║"
echo "║  Токены:    demo/tokens.json                         ║"
echo "║  Логи:      docker compose logs -f                    ║"
echo "║  Стоп:      docker compose down                       ║"
echo "╚══════════════════════════════════════════════════════╝"
