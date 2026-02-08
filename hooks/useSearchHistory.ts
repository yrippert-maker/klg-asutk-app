/**
 * Хук для сохранения истории поисков
 */
'use client';

import { useLocalStorage } from './useLocalStorage';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

const MAX_HISTORY_ITEMS = 20;

export function useSearchHistory() {
  const [history, setHistory] = useLocalStorage<SearchHistoryItem[]>(
    'searchHistory',
    []
  );

  const addToHistory = (query: string, resultCount?: number) => {
    if (!query.trim()) {
      return;
    }

    setHistory((prev) => {
      // Удаляем дубликаты
      const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
      
      // Добавляем новый запрос в начало
      const newHistory = [
        { query, timestamp: Date.now(), resultCount },
        ...filtered,
      ].slice(0, MAX_HISTORY_ITEMS);

      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeFromHistory = (query: string) => {
    setHistory((prev) => prev.filter((item) => item.query !== query));
  };

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}
