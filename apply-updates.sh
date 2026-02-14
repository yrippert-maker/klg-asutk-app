#!/bin/bash
# КЛГ АСУ ТК — Скрипт применения обновлений v27
# Использование: ./apply-updates.sh /path/to/your/repo

set -e

TARGET="${1:-.}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════════════╗"
echo "║  КЛГ АСУ ТК v27 — Применение обновлений         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET"
echo ""

# Check target is git repo
if [ ! -d "$TARGET/.git" ]; then
    echo "❌ $TARGET не является git-репозиторием"
    echo "   Использование: ./apply-updates.sh /path/to/repo"
    exit 1
fi

cd "$TARGET"

# Safety: create backup branch
BRANCH="backup-before-v27-$(date +%Y%m%d-%H%M%S)"
echo "📦 Создание резервной ветки: $BRANCH"
git checkout -b "$BRANCH"
git checkout -

echo ""
echo "📁 Копирование новых файлов..."

# === NEW FILES ===
# Backend services
mkdir -p backend/app/services
cp "$SCRIPT_DIR/backend/app/services/fgis_revs.py" backend/app/services/
cp "$SCRIPT_DIR/backend/app/services/ws_manager.py" backend/app/services/

# Backend routes
cp "$SCRIPT_DIR/backend/app/api/routes/fgis_revs.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/global_search.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/import_export.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/notification_prefs.py" backend/app/api/routes/

# Backend models
cp "$SCRIPT_DIR/backend/app/models/personnel_plg.py" backend/app/models/
cp "$SCRIPT_DIR/backend/app/models/airworthiness_core.py" backend/app/models/
cp "$SCRIPT_DIR/backend/app/models/work_orders.py" backend/app/models/

# Backend tests
cp "$SCRIPT_DIR/backend/tests/test_fgis_revs.py" backend/tests/
cp "$SCRIPT_DIR/backend/tests/test_global_search.py" backend/tests/
cp "$SCRIPT_DIR/backend/tests/test_import_export.py" backend/tests/
cp "$SCRIPT_DIR/backend/tests/test_notification_prefs.py" backend/tests/
cp "$SCRIPT_DIR/backend/tests/test_wo_integration.py" backend/tests/

# Dockerfiles
cp "$SCRIPT_DIR/backend/Dockerfile" backend/
cp "$SCRIPT_DIR/Dockerfile" .
cp "$SCRIPT_DIR/Makefile" .

# Frontend pages
for dir in fgis-revs calendar settings profile help; do
    mkdir -p "app/$dir"
    cp "$SCRIPT_DIR/app/$dir/page.tsx" "app/$dir/"
done
mkdir -p app/print/crs
cp "$SCRIPT_DIR/app/print/crs/page.tsx" app/print/crs/

# Components
cp "$SCRIPT_DIR/components/GlobalSearch.tsx" components/
cp "$SCRIPT_DIR/components/NotificationBell.tsx" components/
cp "$SCRIPT_DIR/components/AttachmentUpload.tsx" components/
cp "$SCRIPT_DIR/components/ShortcutsHelp.tsx" components/
cp "$SCRIPT_DIR/components/Breadcrumbs.tsx" components/

# Hooks & lib
cp "$SCRIPT_DIR/hooks/useKeyboardShortcuts.ts" hooks/
cp "$SCRIPT_DIR/lib/validation.ts" lib/

# PWA
cp "$SCRIPT_DIR/public/sw.js" public/

echo ""
echo "📝 Копирование изменённых файлов..."

# === MODIFIED FILES ===
cp "$SCRIPT_DIR/backend/app/main.py" backend/app/
cp "$SCRIPT_DIR/backend/app/api/routes/work_orders.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/defects.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/airworthiness_core.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/regulator.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/health.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/api/routes/aircraft.py" backend/app/api/routes/
cp "$SCRIPT_DIR/backend/app/models/__init__.py" backend/app/models/
cp "$SCRIPT_DIR/backend/app/services/risk_scheduler.py" backend/app/services/

cp "$SCRIPT_DIR/app/dashboard/page.tsx" app/dashboard/
cp "$SCRIPT_DIR/app/airworthiness/page.tsx" app/airworthiness/
cp "$SCRIPT_DIR/app/audit-history/page.tsx" app/audit-history/
cp "$SCRIPT_DIR/app/maintenance/page.tsx" app/maintenance/
cp "$SCRIPT_DIR/app/defects/page.tsx" app/defects/
cp "$SCRIPT_DIR/app/risks/page.tsx" app/risks/
cp "$SCRIPT_DIR/app/inbox/page.tsx" app/inbox/
cp "$SCRIPT_DIR/app/applications/page.tsx" app/applications/
cp "$SCRIPT_DIR/app/modifications/page.tsx" app/modifications/

cp "$SCRIPT_DIR/components/Sidebar.tsx" components/
cp "$SCRIPT_DIR/components/ui/DataTable.tsx" components/ui/
cp "$SCRIPT_DIR/components/ui/PageLayout.tsx" components/ui/

cp "$SCRIPT_DIR/docker-compose.yml" .
cp "$SCRIPT_DIR/README.md" .
cp "$SCRIPT_DIR/CHANGELOG.md" .
cp "$SCRIPT_DIR/DEPLOY.md" .
cp "$SCRIPT_DIR/.gitignore" .
cp "$SCRIPT_DIR/e2e/smoke.spec.ts" e2e/

# CI/CD
mkdir -p .github/workflows
cp "$SCRIPT_DIR/.github/workflows/ci.yml" .github/workflows/

echo ""
echo "✅ Все файлы скопированы"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "  1. Проверить изменения:"
echo "     git diff --stat"
echo ""
echo "  2. Закоммитить:"
echo "     git add -A"
echo "     git commit -m 'v27: ФГИС РЭВС + production hardening'"
echo ""
echo "  3. Запушить:"
echo "     git push origin main"
echo ""
echo "  4. Применить миграции (если есть БД):"
echo "     make migrate"
echo ""
echo "  5. Перезапустить:"
echo "     make docker-rebuild   # Docker"
echo "     # или"
echo "     make dev              # Development"
echo ""
echo "  Резервная ветка: $BRANCH"
echo "  Откат: git checkout $BRANCH"
