'use client';

import type { UserPreferences } from './types';

interface NotificationSettingsProps {
  preferences: UserPreferences;
  onChange: (updater: (prev: UserPreferences) => UserPreferences) => void;
}

export default function NotificationSettings({ preferences, onChange }: NotificationSettingsProps) {
  const items: { key: keyof UserPreferences['notifications']; title: string; desc: string }[] = [
    { key: 'email', title: 'Email уведомления', desc: 'Получать уведомления на электронную почту' },
    { key: 'push', title: 'Push уведомления', desc: 'Получать push-уведомления в браузере' },
    { key: 'sound', title: 'Звуковые сигналы', desc: 'Воспроизводить звук для критических уведомлений' },
    { key: 'criticalOnly', title: 'Только критические', desc: 'Показывать только критические уведомления' },
  ];

  return (
    <div>
      <h3 className="">
        Настройки уведомлений
      </h3>

      <div className="flex gap-3 items-center">
        {items.map(({ key, title, desc }) => (
          <label key={key} className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={preferences.notifications[key]}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked },
                }))
              }
              className="w-full"
            />
            <div>
              <div className="">{title}</div>
              <div className="">{desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
