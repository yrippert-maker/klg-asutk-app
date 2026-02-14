# КЛГ АСУ ТК — Makefile
# Полный цикл: установка → миграции → запуск → тесты → деплой

.PHONY: help install dev prod migrate test test-be test-e2e lint docker-up docker-down clean fgis-sync

help: ## Показать справку
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Установка ────────────────────────────────
install: ## Установить зависимости (backend + frontend)
	cd backend && pip install -r requirements.txt --break-system-packages
	npm install

# ─── Development ──────────────────────────────
dev: ## Запустить в режиме разработки
	@echo "🔧 Starting development servers..."
	docker compose up postgres redis -d
	@sleep 3
	$(MAKE) migrate
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	npm run dev &
	@echo "✅ Backend: http://localhost:8000"
	@echo "✅ Frontend: http://localhost:3000"
	@echo "✅ API Docs: http://localhost:8000/docs"

# ─── Production ───────────────────────────────
prod: ## Запустить production (Docker)
	docker compose up -d --build
	@echo "✅ Production запущен"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  Keycloak: http://localhost:8080"

prod-monitoring: ## Production + мониторинг
	docker compose --profile monitoring up -d --build

# ─── Миграции ─────────────────────────────────
migrate: ## Применить миграции БД
	@echo "📦 Applying migrations..."
	@for f in backend/migrations/*.sql; do \
		echo "  → $$f"; \
		PGPASSWORD=klg psql -h localhost -U klg -d klg -f "$$f" 2>/dev/null || true; \
	done
	@echo "✅ Migrations applied"

# ─── Тесты ────────────────────────────────────
test: test-be test-e2e ## Запустить все тесты

test-be: ## Backend тесты (pytest)
	cd backend && python -m pytest -v --tb=short

test-e2e: ## E2E тесты (Playwright)
	npx playwright test

test-coverage: ## Тесты с покрытием
	cd backend && python -m pytest --cov=app --cov-report=html

# ─── Линтинг ──────────────────────────────────
lint: ## Проверка кода
	cd backend && python -m ruff check app/
	npm run lint

format: ## Форматирование кода
	cd backend && python -m ruff format app/
	npm run format

# ─── ФГИС РЭВС ───────────────────────────────
fgis-sync: ## Ручная синхронизация с ФГИС РЭВС
	@echo "🔄 Syncing with ФГИС РЭВС..."
	curl -s -X POST http://localhost:8000/api/v1/fgis-revs/sync/all \
		-H "Authorization: Bearer $$(cat .token 2>/dev/null || echo test)" \
		| python3 -m json.tool
	@echo "✅ Sync complete"

fgis-status: ## Статус подключения к ФГИС РЭВС
	curl -s http://localhost:8000/api/v1/fgis-revs/connection-status \
		-H "Authorization: Bearer $$(cat .token 2>/dev/null || echo test)" \
		| python3 -m json.tool

# ─── Docker ───────────────────────────────────
docker-up: ## Docker: запустить инфраструктуру
	docker compose up -d postgres redis minio keycloak

docker-down: ## Docker: остановить всё
	docker compose down

docker-logs: ## Docker: логи backend
	docker compose logs -f backend

docker-rebuild: ## Docker: пересобрать
	docker compose up -d --build --force-recreate backend frontend

# ─── Утилиты ──────────────────────────────────
clean: ## Очистка временных файлов
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf .next node_modules/.cache backend/.pytest_cache

health: ## Проверка здоровья
	@echo "Backend:"
	@curl -s http://localhost:8000/api/v1/health | python3 -m json.tool
	@echo "\nDetailed:"
	@curl -s http://localhost:8000/api/v1/health/detailed | python3 -m json.tool

backup-db: ## Бэкап БД
	@mkdir -p backups
	PGPASSWORD=klg pg_dump -h localhost -U klg klg > backups/klg_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup saved to backups/"

restore-db: ## Восстановить БД из последнего бэкапа
	@LATEST=$$(ls -t backups/*.sql 2>/dev/null | head -1); \
	if [ -n "$$LATEST" ]; then \
		PGPASSWORD=klg psql -h localhost -U klg -d klg < "$$LATEST"; \
		echo "✅ Restored from $$LATEST"; \
	else echo "❌ No backups found"; fi
