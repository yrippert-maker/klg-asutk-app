/**
 * Компонент глобального поиска с автодополнением
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearch, getSearchSuggestions, SearchResult } from '@/lib/search/global-search';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useUrlParams } from '@/hooks/useUrlParams';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    aircraft?: any[];
    risks?: any[];
    organizations?: any[];
    documents?: any[];
    audits?: any[];
    checklists?: any[];
    applications?: any[];
  };
}

export default function GlobalSearch({ isOpen, onClose, data = {} }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToHistory } = useSearchHistory();
  const { setSearch } = useUrlParams();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const suggestionsList = getSearchSuggestions(data, query, 5);
      setSuggestions(suggestionsList);
      setShowSuggestions(suggestionsList.length > 0);

      // Выполняем поиск
      const searchResults = globalSearch(data, query);
      setResults(searchResults);
    } else {
      setSuggestions([]);
      setResults([]);
      setShowSuggestions(false);
    }
  }, [query, data]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      return;
    }

    addToHistory(searchQuery, results.length);
    setSearch(searchQuery);
    onClose();
    
    // Переходим на страницу результатов или первую найденную страницу
    if (results.length > 0) {
      router.push(results[0].url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selectedSuggestion = suggestions[selectedIndex];
        setQuery(selectedSuggestion);
        handleSearch(selectedSuggestion);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleResultClick = (result: SearchResult) => {
    addToHistory(query, results.length);
    router.push(result.url);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '100px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Поле поиска */}
        <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Поиск по ВС, рискам, организациям..."
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                outline: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSuggestions([]);
                }}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Результаты */}
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ borderBottom: '1px solid #eee' }}>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                Предложения
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: selectedIndex === index ? '#f5f5f5' : 'white',
                    borderLeft: selectedIndex === index ? '3px solid #1e3a5f' : '3px solid transparent',
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
                Результаты ({results.length})
              </div>
              {results.slice(0, 10).map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginLeft: '16px' }}>
                    {result.type === 'aircraft' && '✈️'}
                    {result.type === 'risk' && '⚠️'}
                    {result.type === 'organization' && '🏢'}
                    {result.type === 'document' && '📄'}
                    {result.type === 'audit' && '🔍'}
                    {result.type === 'checklist' && '✅'}
                    {result.type === 'application' && '📋'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Ничего не найдено
            </div>
          )}

          {query.length < 2 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Введите минимум 2 символа для поиска
            </div>
          )}
        </div>

        {/* Подсказка */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', fontSize: '12px', color: '#666' }}>
          <span>Нажмите Enter для поиска</span>
          <span style={{ marginLeft: '16px' }}>Esc для закрытия</span>
        </div>
      </div>
    </div>
  );
}
