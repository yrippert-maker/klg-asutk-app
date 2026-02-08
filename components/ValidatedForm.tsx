/**
 * Компонент формы с валидацией
 */
'use client';

import { ReactNode, FormEvent } from 'react';
import { ValidationError } from '@/lib/validation/client-validation';

interface ValidatedFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  validationErrors: ValidationError[];
  isSubmitting?: boolean;
  children: ReactNode;
  submitLabel?: string;
}

export default function ValidatedForm({
  onSubmit,
  validationErrors,
  isSubmitting = false,
  children,
  submitLabel = 'Сохранить',
}: ValidatedFormProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Предотвращаем отправку, если есть ошибки
    if (validationErrors.length > 0) {
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {children}
      
      {validationErrors.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '4px',
            color: '#c62828',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Ошибки валидации:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error.field}: {error.message}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          type="submit"
          disabled={isSubmitting || validationErrors.length > 0}
          style={{
            padding: '10px 20px',
            backgroundColor: isSubmitting || validationErrors.length > 0 ? '#ccc' : '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting || validationErrors.length > 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {isSubmitting ? 'Сохранение...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
