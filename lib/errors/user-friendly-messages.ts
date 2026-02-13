/** Понятные пользователю сообщения об ошибках */
export function getUserFriendlyError(error: unknown): { title: string; action?: string } | null {
  if (!error) return null;
  const msg = error instanceof Error ? error.message : String(error);
  const title = msg || 'Произошла ошибка';
  if (msg.includes('401') || msg.includes('Unauthorized')) {
    return { title: 'Требуется авторизация', action: 'Войдите в систему' };
  }
  if (msg.includes('403') || msg.includes('Forbidden')) {
    return { title: 'Нет доступа', action: 'Проверьте права доступа' };
  }
  if (msg.includes('404') || msg.includes('Not found')) {
    return { title: 'Не найдено', action: 'Обновите страницу' };
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
    return { title: 'Ошибка сети', action: 'Проверьте подключение и повторите попытку' };
  }
  return { title, action: 'Повторите попытку позже' };
}

export function getContextualErrorMessage(error: unknown, _context?: string): string {
  const r = getUserFriendlyError(error);
  return r?.title || 'Произошла ошибка';
}
