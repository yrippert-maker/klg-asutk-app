'use client';

import { getUserFriendlyError } from '@/lib/errors/user-friendly-messages';

interface ErrorAlertProps {
  message: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  onClose?: () => void;
}

export default function ErrorAlert({ message, description, error, onRetry, onClose }: ErrorAlertProps) {
  // Получаем понятное сообщение, если передан объект ошибки
  const friendlyError = error ? getUserFriendlyError(error) : null;
  const displayTitle = friendlyError?.title || message;
  
  return (
    <div style={{
      backgroundColor: '#ffebee',
      border: '1px solid #f44336',
      color: '#c62828',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '24px',
      position: 'relative',
    }}>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: '#c62828',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '4px 8px',
          }}
        >
          ×
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>❌</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '16px' }}>
            {displayTitle}
          </div>
          {description && (
            <div style={{ fontSize: '14px', marginTop: '4px', opacity: 0.9 }}>
              {description}
            </div>
          )}
          {friendlyError && friendlyError.action && (
            <div style={{ fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>
              💡 {friendlyError.action}
            </div>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            backgroundColor: '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Повторить попытку
        </button>
      )}
    </div>
  );
}
