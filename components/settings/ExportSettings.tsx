'use client';

import type { UserPreferences } from './types';

interface ExportSettingsProps {
  preferences: UserPreferences;
  onChange: (updater: (prev: UserPreferences) => UserPreferences) => void;
}

export default function ExportSettings({ preferences, onChange }: ExportSettingsProps) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Настройки экспорта
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Формат экспорта по умолчанию
          </label>
          <select
            value={preferences.export.defaultFormat}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                export: { ...prev.export, defaultFormat: e.target.value as UserPreferences['export']['defaultFormat'] },
              }))
            }
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.export.includeHeaders}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                export: { ...prev.export, includeHeaders: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Включать заголовки</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Добавлять заголовки колонок в экспортируемые файлы
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.export.autoExport}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                export: { ...prev.export, autoExport: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Автоматический экспорт</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Планировать автоматический экспорт данных
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
