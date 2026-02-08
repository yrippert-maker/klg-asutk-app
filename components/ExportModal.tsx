/**
 * Модальное окно для экспорта данных
 */
'use client';

import { useState } from 'react';
import { exportToExcel } from '@/lib/export/excel';
import { exportToCSV } from '@/lib/export/csv';
import { exportToPDF } from '@/lib/export/pdf';
import { exportToJSON } from '@/lib/export/json';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  filename?: string;
  title?: string;
  availableColumns?: string[];
  columnLabels?: Record<string, string>;
}

export default function ExportModal({
  isOpen,
  onClose,
  data,
  filename = 'export',
  title = 'Экспорт данных',
  availableColumns,
  columnLabels = {},
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv' | 'pdf' | 'json'>('excel');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns || (data.length > 0 ? Object.keys(data[0]) : [])
  );
  const [exportFilename, setExportFilename] = useState(filename);

  if (!isOpen) return null;

  const allColumns = availableColumns || (data.length > 0 ? Object.keys(data[0]) : []);

  const handleExport = () => {
    const headers = selectedColumns.map((col) => columnLabels[col] || col);

    switch (selectedFormat) {
      case 'excel':
        exportToExcel(data, {
          filename: exportFilename,
          headers,
          columns: selectedColumns,
        });
        break;
      case 'csv':
        exportToCSV(data, {
          filename: exportFilename,
          headers,
          columns: selectedColumns,
        });
        break;
      case 'pdf':
        exportToPDF(data, {
          filename: exportFilename,
          title,
          headers,
          columns: selectedColumns,
        });
        break;
      case 'json':
        exportToJSON(data, {
          filename: exportFilename,
        });
        break;
    }

    onClose();
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const selectAll = () => {
    setSelectedColumns([...allColumns]);
  };

  const deselectAll = () => {
    setSelectedColumns([]);
  };

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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
          {title}
        </h2>

        {/* Формат экспорта */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Формат экспорта
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(['excel', 'csv', 'pdf', 'json'] as const).map((format) => (
              <label
                key={format}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  border: `2px solid ${selectedFormat === format ? '#1e3a5f' : '#ccc'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedFormat === format ? '#f0f4f8' : 'white',
                }}
              >
                <input
                  type="radio"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={(e) => setSelectedFormat(e.target.value as any)}
                  style={{ marginRight: '8px' }}
                />
                {format.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {/* Имя файла */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Имя файла
          </label>
          <input
            type="text"
            value={exportFilename}
            onChange={(e) => setExportFilename(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Выбор колонок */}
        {selectedFormat !== 'json' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500' }}>Выберите колонки</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={selectAll}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                  }}
                >
                  Все
                </button>
                <button
                  onClick={deselectAll}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                  }}
                >
                  Ничего
                </button>
              </div>
            </div>
            <div
              style={{
                maxHeight: '200px',
                overflow: 'auto',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px',
              }}
            >
              {allColumns.map((column) => (
                <label
                  key={column}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => toggleColumn(column)}
                    style={{ marginRight: '8px' }}
                  />
                  {columnLabels[column] || column}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Информация */}
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#666',
          }}
        >
          Будет экспортировано: <strong>{data.length}</strong> записей
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#1e3a5f',
              border: '1px solid #1e3a5f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            disabled={selectedColumns.length === 0 && selectedFormat !== 'json'}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedColumns.length === 0 && selectedFormat !== 'json' ? '#ccc' : '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedColumns.length === 0 && selectedFormat !== 'json' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Экспортировать
          </button>
        </div>
      </div>
    </div>
  );
}
