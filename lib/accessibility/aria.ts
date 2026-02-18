/** ARIA-атрибуты для доступности. MVP: минимальные возвращаемые объекты */
export function getButtonAriaProps(_opts?: {
  label?: string; describedBy?: string; disabled?: boolean; pressed?: boolean; expanded?: boolean; controls?: string;
}) {
  return { 'aria-disabled': false };
}

export function getFormFieldAriaProps(_opts?: {
  id?: string;
  labelId?: string;
  errorId?: string;
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
}) {
  return {};
}

export function getModalAriaProps(_opts?: {
  titleId?: string;
  describedById?: string;
  descriptionId?: string;
}) {
  return { role: 'dialog', 'aria-modal': true };
}
