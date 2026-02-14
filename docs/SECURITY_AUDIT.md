# Security-аудит: инструменты и процедуры

Рекомендации по проведению проверок безопасности с помощью внешних и встроенных инструментов.

---

## 1. Инструменты, встроенные в CI

В репозитории настроен workflow **`.github/workflows/security.yml`**, который запускается при push в `main`, при pull request в `main` и по расписанию (еженедельно).

### 1.1 npm audit (Frontend)

- **Что проверяет:** известные уязвимости в зависимостях npm.
- **В CI:** job `npm-audit`, уровень `--audit-level=high`.
- **Локально:**
  ```bash
  npm audit
  npm audit --audit-level=high   # только high/critical
  npm audit fix                 # автоматическое обновление, с осторожностью
  ```

### 1.2 pip-audit (Backend)

- **Что проверяет:** уязвимости в Python-пакетах (аналог safety).
- **В CI:** job `pip-audit`, зависимости из `backend/requirements.txt`.
- **Локально:**
  ```bash
  pip install pip-audit
  cd backend && pip-audit -r requirements.txt
  ```

### 1.3 Gitleaks (сканирование секретов)

- **Что проверяет:** утечка секретов и ключей в коде и истории коммитов.
- **В CI:** job `secret-scan`, конфиг `.gitleaks.toml` (allowlist для примеров и тестов).
- **Локально:**
  ```bash
  docker run --rm -v "$(pwd):/path" zricethezav/gitleaks:latest detect --source /path
  ```
  или установить [gitleaks](https://github.com/gitleaks/gitleaks) и выполнить `gitleaks detect`.

### 1.4 Dependency Review (Pull Request)

- При открытии PR запускается **actions/dependency-review-action**: проверка добавленных зависимостей на известные уязвимости.

---

## 2. Дополнительные проверки (вручную или отдельным job)

### 2.1 OWASP ZAP (базовое сканирование веб-приложения)

Подходит для проверки фронтенда и API на типовые уязвимости (XSS, инъекции, небезопасные заголовки).

**Базовый запуск (Docker):**

```bash
# Запустить приложение (frontend + backend), затем:
docker run -t --rm -v $(pwd):/zap/wrk:rw \
  -u $(id -u):$(id -g) \
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap_report.html
```

Для API:

```bash
docker run -t --rm -v $(pwd):/zap/wrk:rw \
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:8000/docs \
  -r zap_api_report.html
```

Результаты в `zap_report.html` / `zap_api_report.html`. Критичные и высокие риски нужно разбирать и устранять.

### 2.2 SAST (статический анализ кода)

- **Frontend:** в CI уже используется ESLint (в т.ч. правила безопасности); при необходимости можно добавить `eslint-plugin-security` или SonarQube/SonarCloud.
- **Backend:** можно подключить Bandit (`pip install bandit`, `bandit -r backend/app`) или Semgrep; при необходимости — отдельный job в CI.

Пример Bandit (локально):

```bash
pip install bandit
cd backend && bandit -r app -ll
```

### 2.3 Контейнеры (образы Docker)

- Сканирование образов на уязвимости: **Trivy**, **Snyk**, **docker scout**.
- Пример Trivy:
  ```bash
  docker build -t klg-backend:latest ./backend
  trivy image klg-backend:latest
  ```

---

## 3. Регулярность проверок

| Проверка | Частота | Где |
|----------|---------|-----|
| npm audit, pip-audit, gitleaks | При каждом push/PR в main + еженедельно | GitHub Actions |
| Dependency Review | Каждый PR в main | GitHub Actions |
| OWASP ZAP | Перед релизом или ежеквартально | Вручную / отдельный job |
| SAST (Bandit/Semgrep) | По желанию в CI или перед релизом | Вручную / job |
| Сканирование образов (Trivy) | При сборке образов или перед деплоем | Вручную / job |

---

## 4. Что делать при обнаружении уязвимости

1. **Критичная/высокая в зависимостях:** обновить пакет до безопасной версии или найти обход (patch/workaround); при необходимости временно задокументировать риск.
2. **Секрет в репозитории:** считать секрет скомпрометированным, сменить его, удалить из истории (git filter-branch / BFG) или использовать allowlist в gitleaks только для нечувствительных примеров.
3. **Уязвимость в коде (ZAP, SAST):** исправить по рекомендациям инструмента и перепроверить.
4. Не создавать публичные issue с детальным описанием уязвимости до её устранения; отчёт направлять ответственным за безопасность (см. [SECURITY.md](SECURITY.md)).

---

## 5. Чек-лист перед релизом

- [ ] `npm audit` и `pip-audit` без критичных/высоких рисков или риски приняты и задокументированы.
- [ ] Gitleaks не находит новых секретов (с учётом allowlist).
- [ ] Базовое сканирование OWASP ZAP выполнено, критичные находки устранены.
- [ ] Образы Docker отсканированы (Trivy/Snyk), критичные уязвимости устранены или приняты.

---

© АО «REFLY» — Разработчик АСУ ТК КЛГ
