'use client';

import { useState, useEffect, useRef } from 'react';
import { useUserSettings } from '@/hooks/useLocalStorage';
import { defaultPreferences, type UserPreferences, type SettingsTabId } from './settings/types';
import SettingsTabs from './settings/SettingsTabs';
import GeneralSettings from './settings/GeneralSettings';
import NotificationSettings from './settings/NotificationSettings';
import ExportSettings from './settings/ExportSettings';
import DisplaySettings from './settings/DisplaySettings';
import AIAccessSettings from './settings/AIAccessSettings';
import AdvancedSettings from './settings/AdvancedSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { setTheme, setLanguage } = useUserSettings();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const modalRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    updater: Partial<UserPreferences> | ((prev: UserPreferences) => UserPreferences)
  ) => {
    setPreferences((prev) =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
    );
  };

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPreferences({ ...defaultPreferences, ...parsed });
        } catch (error) {
          console.error('Ошибка загрузки настроек:', error);
        }
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setTheme(preferences.theme);
    setLanguage(preferences.language);
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: preferences }));
    alert('Настройки сохранены');
    onClose();
  };

  const handleReset = () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      setPreferences(defaultPreferences);
      localStorage.removeItem('userPreferences');
      setTheme('light');
      setLanguage('ru');
      alert('Настройки сброшены');
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal={true}
      aria-label="Окно настроек"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Настройки</h2>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {activeTab === 'general' && (
              <GeneralSettings
                preferences={preferences}
                onChange={handleChange}
                onThemeChange={setTheme}
                onLanguageChange={setLanguage}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings preferences={preferences} onChange={handleChange} />
            )}
            {activeTab === 'export' && (
              <ExportSettings preferences={preferences} onChange={handleChange} />
            )}
            {activeTab === 'display' && (
              <DisplaySettings preferences={preferences} onChange={handleChange} />
            )}
            {activeTab === 'ai-access' && <AIAccessSettings />}
            {activeTab === 'advanced' && (
              <AdvancedSettings
                preferences={preferences}
                onChange={handleChange}
                onReset={handleReset}
              />
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#666',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
