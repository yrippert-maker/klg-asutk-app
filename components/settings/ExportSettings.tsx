'use client';

import type { UserPreferences } from './types';

interface ExportSettingsProps {
  preferences: UserPreferences;
  onChange: (updater: (prev: UserPreferences) => UserPreferences) => void;
}

export default function ExportSettings({ preferences, onChange }: ExportSettingsProps) {
  return (
    <div>
      <h3 className="">
        Настройки экспорта
      </h3>

      <div className="flex gap-3 items-center">
        <div>
          <label>
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
           
          >
            <option value="excel">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={preferences.export.includeHeaders}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                export: { ...prev.export, includeHeaders: e.target.checked },
              }))
            }
            className="w-full"
          />
          <div>
            <div className="">Включать заголовки</div>
            <div className="">
              Добавлять заголовки колонок в экспортируемые файлы
            </div>
          </div>
        </label>

        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={preferences.export.autoExport}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                export: { ...prev.export, autoExport: e.target.checked },
              }))
            }
            className="w-full"
          />
          <div>
            <div className="">Автоматический экспорт</div>
            <div className="">
              Планировать автоматический экспорт данных
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
