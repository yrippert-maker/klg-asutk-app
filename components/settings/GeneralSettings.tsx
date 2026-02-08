'use client';

import type { UserPreferences } from './types';

interface GeneralSettingsProps {
  preferences: UserPreferences;
  onChange: (update: Partial<UserPreferences> | ((prev: UserPreferences) => UserPreferences)) => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
  onLanguageChange: (language: 'ru' | 'en') => void;
}

export default function GeneralSettings({
  preferences,
  onChange,
  onThemeChange,
  onLanguageChange,
}: GeneralSettingsProps) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Общие настройки
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Тема оформления
          </label>
          <select
            value={preferences.theme}
            onChange={(e) => {
              const value = e.target.value as 'light' | 'dark';
              onChange({ theme: value });
              onThemeChange(value);
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="light">Светлая</option>
            <option value="dark">Темная</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Язык интерфейса
          </label>
          <select
            value={preferences.language}
            onChange={(e) => {
              const value = e.target.value as 'ru' | 'en';
              onChange({ language: value });
              onLanguageChange(value);
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Автообновление данных
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              checked={preferences.dataRefresh.autoRefresh}
              onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                dataRefresh: { ...prev.dataRefresh, autoRefresh: e.target.checked },
              }))
            }
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontSize: '14px' }}>Включить автоматическое обновление</span>
          </div>
          {preferences.dataRefresh.autoRefresh && (
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>
                Интервал обновления (минуты):
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={preferences.dataRefresh.refreshInterval}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    dataRefresh: {
                      ...prev.dataRefresh,
                      refreshInterval: parseInt(e.target.value) || 5,
                    },
                  }))
                }
                style={{
                  width: '100px',
                  marginLeft: '8px',
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
