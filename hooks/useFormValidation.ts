/**
 * Хук для валидации форм на клиенте
 */
'use client';

import { useState, useCallback } from 'react';
import { ValidationResult, ValidationError } from '@/lib/validation/client-validation';

interface UseFormValidationOptions<T> {
  schema: (data: unknown) => ValidationResult;
  onSubmit: (data: T) => Promise<void> | void;
  initialValues?: Partial<T>;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSubmit,
  initialValues = {},
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Обновление значения поля
  const setValue = useCallback((name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении значения
    if (errors.some((e) => e.field === name)) {
      setErrors((prev) => prev.filter((e) => e.field !== name));
    }
  }, [errors]);

  // Валидация поля
  const validateField = useCallback((name: string, value: any) => {
    const result = schema({ ...values, [name]: value });
    const fieldError = result.errors.find((e) => e.field === name);
    
    if (fieldError) {
      setErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== name);
        return [...filtered, fieldError];
      });
      return false;
    } else {
      setErrors((prev) => prev.filter((e) => e.field !== name));
      return true;
    }
  }, [schema, values]);

  // Валидация всех полей
  const validateAll = useCallback(() => {
    const result = schema(values);
    setErrors(result.errors);
    return result.success;
  }, [schema, values]);

  // Отметка поля как "тронутого"
  const setFieldTouched = useCallback((name: string) => {
    setTouched((prev) => new Set([...Array.from(prev), name]));
    // Валидируем поле при потере фокуса
    if (values[name] !== undefined) {
      validateField(name, values[name]);
    }
  }, [values, validateField]);

  // Проверка, есть ли ошибка для поля
  const getFieldError = useCallback((name: string): string | undefined => {
    return errors.find((e) => e.field === name)?.message;
  }, [errors]);

  // Проверка, было ли поле тронуто
  const isFieldTouched = useCallback((name: string): boolean => {
    return touched.has(name);
  }, [touched]);

  // Проверка, можно ли отправить форму
  const canSubmit = errors.length === 0 && Object.keys(values).length > 0;

  // Отправка формы
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!validateAll()) {
      // Помечаем все поля как тронутые
      setTouched(new Set(Object.keys(values)));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values as T);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, onSubmit, values]);

  // Сброс формы
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors([]);
    setTouched(new Set());
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    canSubmit,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
    getFieldError,
    isFieldTouched,
    handleSubmit,
    reset,
  };
}
