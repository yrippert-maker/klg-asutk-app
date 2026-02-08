/**
 * Хук для работы с localStorage
 */
'use client';

import { useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Состояние для хранения значения
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Функция для обновления значения
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Поддержка функции обновления
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Хук для сохранения фильтров
 */
export function useFilters<T extends Record<string, any>>(
  key: string,
  initialFilters: T
): [T, (filters: T | ((prev: T) => T)) => void, () => void] {
  const [filters, setFilters] = useLocalStorage<T>(key, initialFilters);

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return [filters, setFilters, resetFilters];
}

/**
 * Хук для сохранения настроек пользователя
 */
export function useUserSettings() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const [language, setLanguage] = useLocalStorage<'ru' | 'en'>('language', 'ru');

  return {
    theme,
    setTheme,
    language,
    setLanguage,
  };
}

/**
 * Хук для избранного
 */
export function useFavorites<T extends { id: string | number }>(
  key: string = 'favorites'
): {
  favorites: T[];
  addFavorite: (item: T) => void;
  removeFavorite: (id: string | number) => void;
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (item: T) => void;
} {
  const [favorites, setFavorites] = useLocalStorage<T[]>(key, []);

  const addFavorite = (item: T) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFavorite = (id: string | number) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const isFavorite = (id: string | number) => {
    return favorites.some((f) => f.id === id);
  };

  const toggleFavorite = (item: T) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}

/**
 * Хук для сохранения последней просмотренной страницы
 */
export function useLastVisited() {
  const [lastVisited, setLastVisited] = useLocalStorage<string[]>('lastVisited', []);

  const addVisited = (path: string) => {
    setLastVisited((prev) => {
      const filtered = prev.filter((p) => p !== path);
      return [path, ...filtered].slice(0, 10); // Храним последние 10 страниц
    });
  };

  return {
    lastVisited,
    addVisited,
  };
}
