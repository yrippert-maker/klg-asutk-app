'use client';

import type { UserPreferences } from './types';

interface AdvancedSettingsProps {
  preferences: UserPreferences;
  onChange: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onReset: () => void;
}

export default function AdvancedSettings({
  preferences,
  onChange,
  onReset,
}: AdvancedSettingsProps) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Дополнительные настройки
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.shortcuts.enabled}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                shortcuts: { ...prev.shortcuts, enabled: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Клавиатурные сокращения</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Включить горячие клавиши для быстрой навигации
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.shortcuts.showHints}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                shortcuts: { ...prev.shortcuts, showHints: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
            disabled={!preferences.shortcuts.enabled}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              Показывать подсказки по горячим клавишам
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Отображать подсказки по клавиатурным сокращениям
            </div>
          </div>
        </label>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffc107',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            ⚠️ Сброс настроек
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Сбросить все настройки к значениям по умолчанию
          </div>
          <button
            onClick={onReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Сбросить настройки
          </button>
        </div>
      </div>
    </div>
  );
}
