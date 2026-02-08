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
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Настройки уведомлений
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {items.map(({ key, title, desc }) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferences.notifications[key]}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked },
                }))
              }
              style={{ width: '18px', height: '18px' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{title}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
