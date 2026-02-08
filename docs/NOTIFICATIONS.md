# Система уведомлений

## Обзор

Реализована комплексная система уведомлений для отслеживания критических событий и важных изменений в системе.

## Типы уведомлений

### 1. Критические риски
- **Триггер:** Риск с уровнем "Критический" и статусом "Требует внимания"
- **Приоритет:** Critical
- **Действия:** Email уведомление, звуковой сигнал, push-уведомление

### 2. Предстоящие аудиты
- **Триггер:** Аудит запланирован на ближайший месяц
- **Приоритет:** High (≤7 дней) / Medium (>7 дней)
- **Действия:** Email уведомление за месяц и за неделю до аудита

### 3. Истекающие документы
- **Триггер:** Документ истекает в течение 30 дней
- **Приоритет:** High (≤7 дней) / Medium (>7 дней)
- **Действия:** Email уведомление

### 4. Изменения статусов ВС
- **Триггер:** Статус ВС изменен (особенно на "На обслуживании")
- **Приоритет:** High (если "На обслуживании") / Medium
- **Действия:** Уведомление в интерфейсе

## Компоненты

### NotificationBell
Компонент иконки уведомлений в шапке приложения:
- Отображает количество непрочитанных уведомлений
- Пульсирующий индикатор для критических уведомлений
- Открывает центр уведомлений при клике

### NotificationCenter
Модальное окно с списком всех уведомлений:
- Группировка по приоритету (критические сверху)
- Цветовая индикация приоритета
- Переход к связанным страницам при клике
- Автоматическое воспроизведение звука для критических уведомлений

## API Endpoints

### GET /api/notifications
Получение всех уведомлений для текущего пользователя.

**Ответ:**
```json
{
  "notifications": [
    {
      "id": "risk-123",
      "type": "critical_risk",
      "title": "Критический риск требует внимания",
      "message": "Описание риска",
      "priority": "critical",
      "createdAt": "2025-01-22T10:00:00Z",
      "read": false,
      "actionUrl": "/risks?id=123"
    }
  ],
  "count": 10,
  "unreadCount": 3
}
```

### POST /api/notifications/[id]/read
Отметить уведомление как прочитанное.

### POST /api/notifications/email
Отправка email уведомления.

**Тело запроса:**
```json
{
  "type": "critical_risk",
  "userEmail": "user@example.com",
  "riskTitle": "Название риска",
  "aircraftRegistration": "RA-12345",
  "riskId": "123"
}
```

## Настройка

### Email уведомления

Добавьте в `.env.local`:
```env
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@example.com
```

Для использования Nodemailer:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Push уведомления

Добавьте в `.env.local`:
```env
PUSH_NOTIFICATIONS_ENABLED=true
VAPID_EMAIL=your-email@example.com
VAPID_PRIVATE_KEY=your-private-key
```

И в `.env` (публичные переменные):
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
```

Для использования Web Push:
```bash
npm install web-push
```

Генерация VAPID ключей:
```bash
npx web-push generate-vapid-keys
```

### Звуковые сигналы

Добавьте аудио файлы в `public/sounds/`:
- `alert-critical.mp3` - для критических уведомлений
- `alert-critical.ogg` - альтернативный формат

Рекомендуемые источники:
- [freesound.org](https://freesound.org)
- [zapsplat.com](https://www.zapsplat.com)

## Интеграция

### Добавление NotificationBell в layout

```tsx
import NotificationBell from '@/components/NotificationBell';

// В шапке приложения
<NotificationBell userId={user?.id} />
```

### Автоматическая проверка уведомлений

Уведомления автоматически обновляются каждые 5 минут. Для более частых обновлений измените интервал в `NotificationBell.tsx`:

```tsx
const interval = setInterval(loadNotifications, 1 * 60 * 1000); // Каждую минуту
```

## Кастомизация

### Приоритеты

Можно настроить цвета и иконки приоритетов в `NotificationCenter.tsx`:

```tsx
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return '#f44336';
    case 'high': return '#ff9800';
    // ...
  }
};
```

### Звуки

Для разных типов уведомлений можно использовать разные звуки:

```tsx
<audio ref={audioRef} preload="auto">
  <source src={`/sounds/alert-${notification.type}.mp3`} type="audio/mpeg" />
</audio>
```

## Безопасность

- Rate limiting на всех API endpoints
- Проверка прав доступа перед отправкой email
- Валидация данных перед отправкой push-уведомлений
- Логирование всех отправленных уведомлений

## Производительность

- Кэширование уведомлений на клиенте
- Пагинация для большого количества уведомлений
- Ленивая загрузка звуковых файлов
- Оптимизация запросов к БД
