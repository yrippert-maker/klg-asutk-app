'use client';

import type { SettingsTabId } from './types';

interface SettingsTabsProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

const TABS: { id: SettingsTabId; label: string; icon: string }[] = [
  { id: 'general', label: 'Общие', icon: '⚙️' },
  { id: 'notifications', label: 'Уведомления', icon: '🔔' },
  { id: 'export', label: 'Экспорт', icon: '📥' },
  { id: 'display', label: 'Отображение', icon: '🎨' },
  { id: 'ai-access', label: 'ИИ Агент', icon: '🤖' },
  { id: 'advanced', label: 'Дополнительно', icon: '🔧' },
];

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div
     
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
         
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = '#e8e8e8';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
