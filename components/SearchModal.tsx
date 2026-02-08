'use client';

import { useState, useEffect } from 'react';
import { Aircraft } from '@/lib/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraft: Aircraft[];
  searchType: 'organization' | 'dashboard' | 'aircraft';
  onNavigate?: (path: string, data?: any) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  aircraft,
  searchType,
  onNavigate,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTypeFilter, setSearchTypeFilter] = useState<'registration' | 'aircraftType' | 'operator'>('registration');
  const [results, setResults] = useState<Aircraft[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    let filtered: Aircraft[] = [];

    if (searchType === 'organization') {
      // Поиск только по номеру ВС или типу
      if (searchTypeFilter === 'registration') {
        filtered = aircraft.filter(a =>
          a.registrationNumber.toLowerCase().includes(query)
        );
      } else if (searchTypeFilter === 'aircraftType') {
        filtered = aircraft.filter(a =>
          a.aircraftType.toLowerCase().includes(query)
        );
      }
    } else {
      // Поиск по номеру ВС, типу или оператору
      filtered = aircraft.filter(a =>
        a.registrationNumber.toLowerCase().includes(query) ||
        a.aircraftType.toLowerCase().includes(query) ||
        (a.operator && a.operator.toLowerCase().includes(query))
      );
    }

    setResults(filtered);
  }, [searchQuery, searchTypeFilter, aircraft, searchType]);

  const handleResultClick = (item: Aircraft) => {
    if (searchType === 'dashboard' && onNavigate) {
      // Определяем тип поиска и переходим на соответствующую страницу
      const query = searchQuery.toLowerCase().trim();
      
      if (item.registrationNumber.toLowerCase().includes(query)) {
        // Поиск по номеру ВС - переход на страницу ВС
        onNavigate(`/aircraft?highlight=${item.id}`);
      } else if (item.aircraftType.toLowerCase().includes(query)) {
        // Поиск по типу ВС - переход на страницу ВС с фильтром по типу
        onNavigate(`/aircraft?type=${encodeURIComponent(item.aircraftType)}`);
      } else if (item.operator && item.operator.toLowerCase().includes(query)) {
        // Поиск по оператору - переход на страницу организаций
        onNavigate(`/organizations?operator=${encodeURIComponent(item.operator)}`);
      } else {
        // По умолчанию - переход на страницу ВС
        onNavigate(`/aircraft?highlight=${item.id}`);
      }
    }
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {searchType === 'organization' || searchType === 'aircraft' ? 'Поиск воздушных судов' : 'Поиск'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {searchType === 'organization' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Тип поиска:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSearchTypeFilter('registration')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: searchTypeFilter === 'registration' ? '#1e3a5f' : '#e0e0e0',
                  color: searchTypeFilter === 'registration' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                По номеру ВС
              </button>
              <button
                onClick={() => setSearchTypeFilter('aircraftType')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: searchTypeFilter === 'aircraftType' ? '#1e3a5f' : '#e0e0e0',
                  color: searchTypeFilter === 'aircraftType' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                По типу ВС
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder={
              searchType === 'organization'
                ? searchTypeFilter === 'registration'
                  ? 'Введите номер воздушного судна...'
                  : 'Введите тип воздушного судна...'
                : 'Поиск по номеру ВС, типу или компании...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            autoFocus
          />
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              Найдено: {results.length}
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  style={{
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    backgroundColor: '#f9f9f9',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {item.registrationNumber}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Тип: {item.aircraftType}
                  </div>
                  {item.operator && item.operator !== 'Не указан' && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Оператор: {item.operator}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    Статус: {item.status} | Налет: {item.flightHours} ч
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery.trim() !== '' && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Ничего не найдено
          </div>
        )}

        {searchQuery.trim() === '' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Введите запрос для поиска
          </div>
        )}
      </div>
    </div>
  );
}
