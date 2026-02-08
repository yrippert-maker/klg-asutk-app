/**
 * Доступное поле ввода с поддержкой ARIA
 */
'use client';

import { InputHTMLAttributes, useId } from 'react';
import { getFormFieldAriaProps } from '@/lib/accessibility/aria';
import FormField from './FormField';

interface AccessibleInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label' | 'aria-describedby'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export default function AccessibleInput({
  label,
  error,
  hint,
  required = false,
  id,
  ...inputProps
}: AccessibleInputProps) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const errorId = error ? `error-${generatedId}` : undefined;
  const hintId = hint ? `hint-${generatedId}` : undefined;
  
  const ariaProps = getFormFieldAriaProps({
    labelId: `${inputId}-label`,
    describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined,
    required,
    invalid: !!error,
    errorId,
  });

  return (
    <FormField
      label={label}
      name={inputId}
      error={error}
      required={required}
      hint={hint}
    >
      <input
        {...inputProps}
        {...ariaProps}
        id={inputId}
        style={{
          width: '100%',
          padding: '10px',
          border: `1px solid ${error ? '#f44336' : '#ccc'}`,
          borderRadius: '4px',
          fontSize: '14px',
          ...inputProps.style,
        }}
      />
      {hint && (
        <div id={hintId} style={{ display: 'none' }}>
          {hint}
        </div>
      )}
      {error && (
        <div id={errorId} style={{ display: 'none' }}>
          {error}
        </div>
      )}
    </FormField>
  );
}
