'use client';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function DisplaySettings() {
  const { theme, setTheme, isDark } = useDarkMode();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Отображение</h3>
      <div className="space-y-2">
        {(['light', 'dark', 'system'] as const).map(t => (
          <label key={t} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50">
            <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t)} className="w-4 h-4" />
            <span className="text-sm font-medium">{t === 'light' ? '☀️ Светлая' : t === 'dark' ? '🌙 Тёмная' : '💻 Системная'}</span>
          </label>
        ))}
      </div>
      <div className="p-4 bg-gray-50 rounded text-sm text-gray-500">
        Текущая тема: {isDark ? 'Тёмная' : 'Светлая'}
      </div>
    </div>
  );
}
