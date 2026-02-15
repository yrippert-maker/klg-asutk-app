# Документация по развертыванию

## Требования

- Node.js 20+
- npm или yarn
- Доступ к серверу (VPS, облако)

## Подготовка к развертыванию

### 1. Настройка переменных окружения

Создайте файл `.env.production`:

```env
# API
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_USE_REGISTRY_DATA=true

# AI (Anthropic Claude)
ANTHROPIC_API_KEY=your-production-api-key

# Логирование
LOG_LEVEL=info
NODE_ENV=production

# Безопасность
NEXTAUTH_URL=https://klg-app.example.com
NEXTAUTH_SECRET=your-secret-key
```

### 2. Сборка приложения

```bash
npm run build
```

### 3. Проверка сборки

```bash
npm run start
```

## Развертывание на Vercel

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в аккаунт:
```bash
vercel login
```

3. Разверните:
```bash
vercel --prod
```

4. Настройте переменные окружения в панели Vercel

## Развертывание на собственный сервер

### Использование PM2

1. Установите PM2:
```bash
npm install -g pm2
```

2. Запустите приложение:
```bash
pm2 start npm --name "klg-app" -- start
```

3. Сохраните конфигурацию:
```bash
pm2 save
pm2 startup
```

### Использование Docker

1. Создайте `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

2. Соберите образ:
```bash
docker build -t klg-app .
```

3. Запустите контейнер:
```bash
docker run -p 3000:3000 --env-file .env.production klg-app
```

## Настройка Nginx (опционально)

```nginx
server {
    listen 80;
    server_name klg-app.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL сертификат

Используйте Let's Encrypt для бесплатного SSL:

```bash
sudo certbot --nginx -d klg-app.example.com
```

## Мониторинг

### Логи

Логи сохраняются в:
- `logs/error.log` - ошибки
- `logs/combined.log` - все логи

### Мониторинг производительности

Рекомендуется использовать:
- PM2 Monitoring (при использовании PM2)
- Sentry для отслеживания ошибок
- Grafana для метрик

## Резервное копирование

### Автоматическое резервное копирование

Настройте cron job для резервного копирования данных:

```bash
0 2 * * * /path/to/backup-script.sh
```

## Обновление

1. Получите последние изменения:
```bash
git pull origin main
```

2. Установите зависимости:
```bash
npm ci
```

3. Пересоберите:
```bash
npm run build
```

4. Перезапустите:
```bash
pm2 restart klg-app
# или
docker-compose restart
```

## Откат (Rollback)

### PM2

```bash
pm2 restart klg-app --update-env
```

### Docker

```bash
docker-compose down
docker-compose up -d --scale app=1
```

### Git

```bash
git checkout <previous-commit>
npm run build
pm2 restart klg-app
```

## Проверка работоспособности

После развертывания проверьте:

1. Доступность приложения: `https://klg-app.example.com`
2. API endpoints: `https://klg-app.example.com/api/aircraft`
3. Логи на наличие ошибок
4. Производительность

## Troubleshooting

### Приложение не запускается

1. Проверьте логи: `pm2 logs klg-app`
2. Проверьте переменные окружения
3. Проверьте порт (должен быть свободен)

### Ошибки в production

1. Проверьте `logs/error.log`
2. Убедитесь, что все зависимости установлены
3. Проверьте версию Node.js

### Проблемы с производительностью

1. Включите кэширование
2. Оптимизируйте запросы к БД
3. Используйте CDN для статических ресурсов
