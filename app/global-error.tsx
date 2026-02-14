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
         
        >
          <div
           
          >
            <div className="">⚠️</div>
            <h2
             
            >
              Критическая ошибка
            </h2>
            <p
             
            >
              Произошла критическая ошибка приложения. Пожалуйста, обновите страницу.
            </p>
            <button
              onClick={reset}
             
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
