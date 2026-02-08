/**
 * Компонент поля формы с валидацией
 */
'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}

export default function FormField({
  label,
  name,
  error,
  required = false,
  children,
  hint,
}: FormFieldProps) {
  const labelId = `${name}-label`;
  const errorId = error ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        id={labelId}
        htmlFor={name}
        style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
        }}
      >
        {label}
        {required && (
          <span 
            aria-label="обязательное поле"
            style={{ color: '#f44336', marginLeft: '4px' }}
          >
            *
          </span>
        )}
      </label>
      <div aria-describedby={describedBy}>
        {children}
      </div>
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#f44336',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <div
          id={hintId}
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
