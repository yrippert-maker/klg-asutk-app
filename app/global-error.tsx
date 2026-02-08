/**
 * Глобальный обработчик ошибок для корневого layout
 */
'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
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
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#333',
              }}
            >
              Критическая ошибка
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              Произошла критическая ошибка приложения. Пожалуйста, обновите страницу.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1e3a5f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
