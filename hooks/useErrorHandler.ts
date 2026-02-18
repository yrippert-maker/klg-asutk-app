/**
 * Хук для обработки ошибок в компонентах
 */
'use client';

import { useState, useCallback } from 'react';
import { logError } from '@/lib/logger';
import { getUserFriendlyError, getContextualErrorMessage } from '@/lib/errors/user-friendly-messages';
import { captureException } from '@/lib/monitoring/sentry';

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  logError?: boolean;
  sendToSentry?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [error, setError] = useState<Error | null>(null);
  const [userFriendlyError, setUserFriendlyError] = useState<ReturnType<typeof getUserFriendlyError> | null>(null);

  const handleError = useCallback((error: unknown, context?: { action?: string; resource?: string }) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Логирование
    if (options.logError !== false) {
      logError('Component error', errorObj, context);
    }
    
    // Отправка в Sentry
    if (options.sendToSentry !== false && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        captureException(errorObj, context);
      } catch (e) {
        // Игнорируем ошибки Sentry
      }
    }
    
    // Установка ошибки
    setError(errorObj);
    
    // Получение понятного сообщения (единый тип { title, action? } | null)
    const friendlyError = context
      ? getContextualErrorMessage(errorObj, context)
      : getUserFriendlyError(errorObj);
    const resolved =
      typeof friendlyError === 'string'
        ? friendlyError ? { title: friendlyError } : null
        : friendlyError;
    setUserFriendlyError(resolved);
    
    // Вызов пользовательского обработчика
    if (options.onError) {
      options.onError(errorObj);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
    setUserFriendlyError(null);
  }, []);

  return {
    error,
    userFriendlyError,
    handleError,
    clearError,
    hasError: error !== null,
  };
}
