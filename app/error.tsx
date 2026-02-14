/**
 * Глобальная страница ошибок Next.js
 */
'use client';

import { useEffect } from 'react';
import ErrorDisplay from '@/components/ErrorDisplay';
import { getUserFriendlyError } from '@/lib/errors/user-friendly-messages';
import { captureException } from '@/lib/monitoring/sentry';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логирование ошибки
    console.error('Global error:', error);
    
    // Отправка в Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        captureException(error, {
          digest: error.digest,
          component: 'global-error',
        });
      } catch (e) {
        // Игнорируем ошибки Sentry
      }
    }
  }, [error]);

  const friendlyError = getUserFriendlyError(error);

  return (
    <div
     
    >
      <div className="max-w-xl">
        <ErrorDisplay
          title={friendlyError.title}
          message={friendlyError.message}
          type={friendlyError.type}
          onRetry={reset}
          showDetails={process.env.NODE_ENV === 'development'}
          details={error.stack}
        />
      </div>
    </div>
  );
}
