/**
 * Error Boundary для обработки ошибок React компонентов
 */
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логирование ошибки (только на клиенте)
    if (typeof window !== 'undefined') {
      // Используем console.error для клиентского логирования
      console.error('React Error Boundary caught an error:', error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
      
      // Отправка в Sentry через API (если настроен)
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        try {
          fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
            }),
          }).catch(() => {
            // Игнорируем ошибки отправки
          });
        } catch (e) {
          // Игнорируем ошибки
        }
      }
    }

    // Отправка в Sentry (если настроен)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    this.setState({
      error,
      errorInfo,
    });

    // Вызов пользовательского обработчика
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="p-5"
        >
          <div
            className="p-5"
          >
            <div
              className="my-4"
            >
              ⚠️
            </div>
            <h2
              className="text-gray-600"
            >
              Произошла ошибка
            </h2>
            <p
              className="text-gray-600"
            >
              К сожалению, произошла непредвиденная ошибка. Мы уже работаем над её исправлением.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                className="p-5"
              >
                <summary
                  className="my-4"
                >
                  Детали ошибки (только в режиме разработки)
                </summary>
                <pre
                  className="text-sm"
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="p-5"
              >
                Попробовать снова
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="p-5"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC для обертки компонентов в Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
export default ErrorBoundary;
