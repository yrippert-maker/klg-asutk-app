/**
 * Хук для клавиатурных сокращений (горячие клавиши)
 */
'use client';

import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description?: string;
}

/**
 * Основной хук для горячих клавиш
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const keyMatch =
          event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

/**
 * Хук для глобальных горячих клавиш приложения
 */
export function useGlobalShortcuts(options: {
  onSearch?: () => void;
  onCreateNew?: () => void;
  onSave?: () => void;
  onClose?: () => void;
}) {

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        options.onSearch?.();
      },
      description: 'Глобальный поиск',
    },
    {
      key: 'n',
      ctrl: true,
      handler: () => {
        options.onCreateNew?.();
      },
      description: 'Создать новую запись',
    },
    {
      key: 's',
      ctrl: true,
      handler: () => {
        options.onSave?.();
      },
      description: 'Сохранить форму',
    },
    {
      key: 'Escape',
      handler: () => {
        options.onClose?.();
      },
      description: 'Закрыть модальное окно',
    },
  ]);
}

// Компонент KeyboardShortcutsHelp вынесен в components/KeyboardShortcutsHelp.tsx

/**
 * Хук для показа/скрытия подсказок
 */
export function useShortcutsHelp() {
  const [showHelp, setShowHelp] = useLocalStorage<boolean>('showShortcutsHelp', false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+? или Cmd+? для показа подсказок
      if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setShowHelp]);

  return { showHelp, setShowHelp };
}
