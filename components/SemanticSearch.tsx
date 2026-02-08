'use client';

import { useState } from 'react';

interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  type: string;
  similarity: number;
}

interface SemanticSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
}

export default function SemanticSearch({ 
  onResultSelect,
  placeholder = 'Семантический поиск по базе знаний...'
}: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>('all');

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          type: type === 'all' ? undefined : type,
          limit: 10,
          threshold: 0.7,
        }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      // Ошибка уже обработана в API
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="all">Все типы</option>
          <option value="aircraft">Воздушные суда</option>
          <option value="audit">Аудиты</option>
          <option value="risk">Риски</option>
          <option value="regulation">Нормативы</option>
          <option value="document">Документы</option>
          <option value="insight">Инсайты</option>
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: loading || !query.trim() ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {loading ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Найдено: {results.length} результатов
          </div>
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => onResultSelect?.(result)}
              style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                cursor: onResultSelect ? 'pointer' : 'default',
                borderLeft: `4px solid ${
                  result.type === 'risk' ? '#f44336' :
                  result.type === 'audit' ? '#ff9800' :
                  result.type === 'aircraft' ? '#2196f3' :
                  '#4caf50'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                  {result.type}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Релевантность: {Math.round(result.similarity * 100)}%
                </span>
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {result.content.substring(0, 200)}
                {result.content.length > 200 && '...'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
