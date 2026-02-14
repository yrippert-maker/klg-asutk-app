export function filterSchema(data: any) { return data; }
/**
 * Frontend form validation — КЛГ АСУ ТК
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FieldError {
  field: string;
  message: string;
}

export function validate(data: Record<string, any>, rules: Record<string, ValidationRule>): FieldError[] {
  const errors: FieldError[] = [];
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push({ field, message: 'Обязательное поле' });
      continue;
    }
    if (value && rule.minLength && String(value).length < rule.minLength) {
      errors.push({ field, message: `Минимум ${rule.minLength} символов` });
    }
    if (value && rule.maxLength && String(value).length > rule.maxLength) {
      errors.push({ field, message: `Максимум ${rule.maxLength} символов` });
    }
    if (value && rule.pattern && !rule.pattern.test(String(value))) {
      errors.push({ field, message: 'Неверный формат' });
    }
    if (rule.custom) {
      const msg = rule.custom(value);
      if (msg) errors.push({ field, message: msg });
    }
  }
  return errors;
}

// Common validation rules
export const RULES = {
  required: { required: true } as ValidationRule,
  aircraft_reg: { required: true, pattern: /^[A-ZА-Я]{1,2}-\d{3,5}$/i, custom: (v: string) => v && !/^[A-ZА-Я]/i.test(v) ? 'Начинается с буквы' : null } as ValidationRule,
  part_number: { required: true, minLength: 2, maxLength: 50 } as ValidationRule,
  serial_number: { required: true, minLength: 2, maxLength: 50 } as ValidationRule,
  personnel_number: { required: true, pattern: /^[A-ZА-Я0-9-]+$/i } as ValidationRule,
};
