/**
 * Конфигурация Sentry для клиентской стороны
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    // new Sentry.BrowserTracing(), // Удалено, так как не поддерживается в текущей версии Sentry
    // new Sentry.Replay({ // Удалено, так как не поддерживается в текущей версии Sentry
    //   maskAllText: true,
    //   blockAllMedia: true,
    // }),
  ],
  beforeSend(event, _hint) {
    // Фильтрация чувствительных данных
    if (event.request?.data) {
      const data = event.request.data as any;
      if (data.password) delete data.password;
      if (data.token) delete data.token;
      if (data.apiKey) delete data.apiKey;
    }
    return event;
  },
});
