'use client';
import { useState } from 'react';
import FormField from '@/components/ui/FormField';

interface Props { onSave?: (s: any) => void; }

export default function GeneralSettings({ onSave }: Props) {
  const [lang, setLang] = useState('ru');
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [dateFormat, setDateFormat] = useState('DD.MM.YYYY');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Общие настройки</h3>
      <FormField label="Язык">
        <select value={lang} onChange={e => setLang(e.target.value)} className="input-field">
          <option value="ru">Русский</option><option value="en">English</option>
        </select>
      </FormField>
      <FormField label="Часовой пояс">
        <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-field">
          <option value="Europe/Moscow">Москва (UTC+3)</option><option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
          <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option><option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
        </select>
      </FormField>
      <FormField label="Формат даты">
        <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="input-field">
          <option>DD.MM.YYYY</option><option>YYYY-MM-DD</option><option>MM/DD/YYYY</option>
        </select>
      </FormField>
      <button onClick={() => onSave?.({ lang, timezone, dateFormat })} className="btn-primary">Сохранить</button>
    </div>
  );
}
