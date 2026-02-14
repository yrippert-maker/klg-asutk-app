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
      <h3 className="">
        Дополнительные настройки
      </h3>

      <div className="flex gap-3 items-center">
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={preferences.shortcuts.enabled}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                shortcuts: { ...prev.shortcuts, enabled: e.target.checked },
              }))
            }
            className="w-full"
          />
          <div>
            <div className="">Клавиатурные сокращения</div>
            <div className="">
              Включить горячие клавиши для быстрой навигации
            </div>
          </div>
        </label>

        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={preferences.shortcuts.showHints}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                shortcuts: { ...prev.shortcuts, showHints: e.target.checked },
              }))
            }
            className="w-full"
            disabled={!preferences.shortcuts.enabled}
          />
          <div>
            <div className="">
              Показывать подсказки по горячим клавишам
            </div>
            <div className="">
              Отображать подсказки по клавиатурным сокращениям
            </div>
          </div>
        </label>

        <div
         
        >
          <div className="">
            ⚠️ Сброс настроек
          </div>
          <div className="">
            Сбросить все настройки к значениям по умолчанию
          </div>
          <button
            onClick={onReset}
           
          >
            Сбросить настройки
          </button>
        </div>
      </div>
    </div>
  );
}
