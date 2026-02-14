/**
 * Simple toast notification for API errors.
 * Renders a top-right notification that auto-dismisses.
 * Разработчик: АО «REFLY»
 */

let container: HTMLDivElement | null = null;

function ensureContainer() {
  if (container) return container;
  if (typeof document === 'undefined') return null;
  container = document.createElement('div');
  container.id = 'klg-toast-container';
  Object.assign(container.style, {
    position: 'fixed', top: '16px', right: '16px', zIndex: '10000',
    display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none',
  });
  document.body.appendChild(container);
  return container;
}

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'error') {
  const c = ensureContainer();
  if (!c) return;
  const colors = { error: '#e74c3c', success: '#4caf50', info: '#2196f3' };
  const el = document.createElement('div');
  Object.assign(el.style, {
    padding: '12px 20px', borderRadius: '8px', color: 'white', fontSize: '14px',
    backgroundColor: colors[type], boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    pointerEvents: 'auto', cursor: 'pointer', opacity: '0', transition: 'opacity 0.3s',
    maxWidth: '400px',
  });
  el.textContent = message;
  el.onclick = () => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); };
  c.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 5000);
}

export function showApiError(error: any) {
  const msg = error?.body?.detail || error?.message || 'Ошибка сервера';
  showToast(msg, 'error');
}
