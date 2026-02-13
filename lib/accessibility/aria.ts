/** ARIA-атрибуты для доступности. MVP: минимальные возвращаемые объекты */
export function getButtonAriaProps(_opts?: { disabled?: boolean; pressed?: boolean }) {
  return { 'aria-disabled': false };
}

export function getFormFieldAriaProps(_opts?: { id?: string; labelId?: string; errorId?: string; invalid?: boolean }) {
  return {};
}

export function getModalAriaProps(_opts?: { titleId?: string; describedById?: string }) {
  return { role: 'dialog', 'aria-modal': true };
}
