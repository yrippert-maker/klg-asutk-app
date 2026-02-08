'use client';

import type { UserPreferences } from './types';

interface DisplaySettingsProps {
  preferences: UserPreferences;
  onChange: (updater: (prev: UserPreferences) => UserPreferences) => void;
}

export default function DisplaySettings({ preferences, onChange }: DisplaySettingsProps) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Настройки отображения
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Записей на странице
          </label>
          <select
            value={preferences.pagination.itemsPerPage}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                pagination: {
                  ...prev.pagination,
                  itemsPerPage: parseInt(e.target.value, 10) || 20,
                },
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
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.pagination.showTotal}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                pagination: { ...prev.pagination, showTotal: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Показывать общее количество</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Отображать общее количество записей в списках
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.display.compactMode}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                display: { ...prev.display, compactMode: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Компактный режим</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Уменьшить отступы и размеры элементов
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.display.showTooltips}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                display: { ...prev.display, showTooltips: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Показывать подсказки</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Отображать всплывающие подсказки при наведении
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={preferences.display.animations}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                display: { ...prev.display, animations: e.target.checked },
              }))
            }
            style={{ width: '18px', height: '18px' }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Анимации</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Включить анимации переходов и эффекты
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
