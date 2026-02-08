/**
 * Панель фильтров и сортировки
 */
'use client';

import { useState } from 'react';
import { useUrlParams } from '@/hooks/useUrlParams';

export interface FilterOption {
  value: string;
  label: string;
}

export interface SortOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  filters?: {
    status?: FilterOption[];
    organization?: FilterOption[];
    type?: FilterOption[];
  };
  sortOptions?: SortOption[];
  onFilterChange?: (filters: any) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  presets?: Array<{ name: string; filters: any }>;
}

export default function FilterPanel({
  filters,
  sortOptions,
  onFilterChange,
  onSortChange,
  presets,
}: FilterPanelProps) {
  const { params, setFilters, setSort, clearFilters } = useUrlParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: string | string[]) => {
    const newFilters = { ...params, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = params.sortBy === sortBy && params.sortOrder === 'asc' ? 'desc' : 'asc';
    setSort(sortBy, newSortOrder);
    onSortChange?.(sortBy, newSortOrder);
  };

  const handlePresetClick = (preset: { name: string; filters: any }) => {
    setFilters(preset.filters);
    onFilterChange?.(preset.filters);
  };

  const hasActiveFilters = 
    params.status ||
    params.organization ||
    params.type ||
    params.dateFrom ||
    params.dateTo;

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isExpanded ? '▼' : '▶'} Фильтры
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#1e3a5f',
                border: '1px solid #1e3a5f',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Сбросить
            </button>
          )}
        </div>

        {sortOptions && sortOptions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#666' }}>Сортировка:</label>
            <select
              value={params.sortBy || ''}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {params.sortBy && (
              <button
                onClick={() => handleSortChange(params.sortBy!)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title={params.sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
              >
                {params.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Быстрые фильтры (presets) */}
          {presets && presets.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
                Быстрые фильтры:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Фильтр по статусу */}
          {filters?.status && filters.status.length > 0 && (
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
                Статус:
              </label>
              <select
                value={params.status?.[0] || ''}
                onChange={(e) => handleFilterChange('status', e.target.value ? [e.target.value] : [])}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Все</option>
                {filters.status.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Фильтр по организации */}
          {filters?.organization && filters.organization.length > 0 && (
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
                Организация:
              </label>
              <select
                value={params.organization || ''}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Все</option>
                {filters.organization.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Фильтр по типу */}
          {filters?.type && filters.type.length > 0 && (
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
                Тип:
              </label>
              <select
                value={params.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="">Все</option>
                {filters.type.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Фильтр по дате */}
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
              Дата от:
            </label>
            <input
              type="date"
              value={params.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block' }}>
              Дата до:
            </label>
            <input
              type="date"
              value={params.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
