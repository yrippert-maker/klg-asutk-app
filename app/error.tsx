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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ maxWidth: '600px', width: '100%' }}>
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
