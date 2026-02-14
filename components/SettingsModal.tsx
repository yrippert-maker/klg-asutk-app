'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; }

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('ru');
  const [notifications, setNotifications] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('60');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Настройки" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Закрыть</button><button onClick={onClose} className="btn-primary">Сохранить</button></>}>
      <FormField label="Тема">
        <select value={theme} onChange={e => setTheme(e.target.value)} className="input-field"><option value="light">Светлая</option><option value="dark">Тёмная</option><option value="auto">Системная</option></select>
      </FormField>
      <FormField label="Язык">
        <select value={lang} onChange={e => setLang(e.target.value)} className="input-field"><option value="ru">Русский</option><option value="en">English</option></select>
      </FormField>
      <FormField label="Уведомления">
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-4 h-4" /><span className="text-sm">Включить push-уведомления</span></label>
      </FormField>
      <FormField label="Интервал обновления">
        <select value={refreshInterval} onChange={e => setRefreshInterval(e.target.value)} className="input-field"><option value="30">30 сек</option><option value="60">1 мин</option><option value="300">5 мин</option><option value="0">Выключить</option></select>
      </FormField>
    </Modal>
  );
}
