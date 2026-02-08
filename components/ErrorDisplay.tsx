/**
 * Компонент для отображения ошибок пользователю
 */
'use client';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onClose?: () => void;
  showDetails?: boolean;
  details?: string;
}

export default function ErrorDisplay({
  title,
  message,
  type = 'error',
  onRetry,
  onClose,
  showDetails = false,
  details,
}: ErrorDisplayProps) {
  const colors = {
    error: {
      bg: '#ffebee',
      border: '#f44336',
      icon: '❌',
      title: title || 'Ошибка',
    },
    warning: {
      bg: '#fff3e0',
      border: '#ff9800',
      icon: '⚠️',
      title: title || 'Предупреждение',
    },
    info: {
      bg: '#e3f2fd',
      border: '#2196f3',
      icon: 'ℹ️',
      title: title || 'Информация',
    },
  };

  const style = colors[type];

  return (
    <div
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        position: 'relative',
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: style.border,
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: style.border,
            }}
          >
            {style.title}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#333',
              lineHeight: '1.5',
            }}
          >
            {message}
          </div>
        </div>
      </div>

      {showDetails && details && (
        <details
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '4px',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            Детали ошибки
          </summary>
          <pre
            style={{
              fontSize: '12px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {details}
          </pre>
        </details>
      )}

      {onRetry && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={onRetry}
            style={{
              padding: '10px 20px',
              backgroundColor: style.border,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
}
