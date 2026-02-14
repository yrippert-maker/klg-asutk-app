/**
 * Global keyboard shortcuts — КЛГ АСУ ТК
 * Ctrl+K: Focus search
 * Ctrl+N: New item (context-dependent)
 * Ctrl+/: Show shortcuts help
 * Escape: Close modals
 */
'use client';
import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
  onNewItem?: () => void;
}

export function useKeyboardShortcuts(config?: ShortcutConfig) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const handler = useCallback((e: KeyboardEvent) => {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

    // Ctrl+K or Cmd+K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const search = document.querySelector<HTMLInputElement>('input[placeholder*="Поиск"]');
      search?.focus();
      return;
    }

    // Ctrl+/ : Toggle shortcuts help
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      setShowHelp(s => !s);
      return;
    }

    if (isInput) return;

    // Navigation shortcuts (no modifier)
    switch (e.key) {
      case 'g': // go to...
        if (e.shiftKey) return;
        // Wait for next key
        const goHandler = (e2: KeyboardEvent) => {
          document.removeEventListener('keydown', goHandler);
          switch (e2.key) {
            case 'd': router.push('/dashboard'); break;
            case 'a': router.push('/airworthiness-core'); break;
            case 'm': router.push('/maintenance'); break;
            case 'p': router.push('/personnel-plg'); break;
            case 'c': router.push('/calendar'); break;
            case 'f': router.push('/defects'); break;
            case 's': router.push('/settings'); break;
          }
        };
        document.addEventListener('keydown', goHandler, { once: true });
        break;
      case '?':
        setShowHelp(s => !s);
        break;
    }
  }, [router]);

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);

  return { showHelp, setShowHelp };
}

export const SHORTCUTS = [
  { keys: 'Ctrl+K', desc: 'Фокус на поиске' },
  { keys: 'Ctrl+/', desc: 'Показать горячие клавиши' },
  { keys: 'g → d', desc: 'Перейти к Dashboard' },
  { keys: 'g → a', desc: 'Контроль ЛГ' },
  { keys: 'g → m', desc: 'Наряды на ТО' },
  { keys: 'g → p', desc: 'Персонал ПЛГ' },
  { keys: 'g → c', desc: 'Календарь ТО' },
  { keys: 'g → f', desc: 'Дефекты' },
  { keys: 'g → s', desc: 'Настройки' },
  { keys: '?', desc: 'Справка по горячим клавишам' },
];
