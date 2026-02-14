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
    <div className="mb-3">
      <label
        id={labelId}
        htmlFor={name}
       
      >
        {label}
        {required && (
          <span 
            aria-label="обязательное поле"
            className=""
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
         
        >
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <div
          id={hintId}
         
        >
          {hint}
        </div>
      )}
    </div>
  );
}
