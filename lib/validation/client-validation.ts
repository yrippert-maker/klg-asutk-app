export interface ValidationError { field: string; message: string; code?: string; }
export interface ValidationResult { valid: boolean; success: boolean; errors: ValidationError[]; }
export function validateField(...a: any[]): ValidationError[] { return []; }
export function validateForm(...a: any[]): ValidationResult { return { valid: true, success: true, errors: [] }; }
export function validateAircraft(...a: any[]): ValidationResult { return { valid: true, success: true, errors: [] }; }
export default { validateField, validateForm, validateAircraft };
