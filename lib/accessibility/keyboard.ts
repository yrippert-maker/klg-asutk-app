/** Горячие клавиши и фокус. MVP: no-op реализации */
export class Hotkey {
  constructor(_key: string, _handler: () => void) {}
  register() {}
  unregister() {}
}

export function createActivationHandler(_handler: () => void, _keys?: string[]) {
  return (_e: KeyboardEvent) => {};
}

export function createEscapeHandler(_handler: () => void) {
  return (e: KeyboardEvent) => { if (e.key === 'Escape') _handler(); };
}

export function createFocusTrap(_container: HTMLElement | null, _onClose?: () => void): () => void {
  return () => {};
}

export function registerHotkeys(_map: Record<string, () => void>) {}
