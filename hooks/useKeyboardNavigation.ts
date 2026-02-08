/**
 * Хук для навигации с клавиатуры
 */
'use client';

import { useEffect, useCallback, useState } from 'react';
import { registerHotkeys, Hotkey } from '@/lib/accessibility/keyboard';

/**
 * Регистрация глобальных горячих клавиш
 */
export function useKeyboardNavigation(hotkeys: Hotkey[]) {
  useEffect(() => {
    const unregister = registerHotkeys(hotkeys);
    return unregister;
  }, [hotkeys]);
}

/**
 * Хук для навигации по списку с клавиатуры
 */
export function useListKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T, index: number) => void,
  initialIndex: number = -1
) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev < items.length - 1 ? prev + 1 : 0;
          return next;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : items.length - 1;
          return next;
        });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onSelect(items[selectedIndex], selectedIndex);
        }
        break;
      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setSelectedIndex(items.length - 1);
        break;
    }
  }, [items, selectedIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
}
