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
      style={{
        width: '200px',
        borderRight: '1px solid #e0e0e0',
        padding: '16px 0',
        backgroundColor: '#f5f5f5',
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            width: '100%',
            padding: '12px 20px',
            textAlign: 'left',
            border: 'none',
            backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
            borderLeft: activeTab === tab.id ? '3px solid #1e3a5f' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
          }}
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
