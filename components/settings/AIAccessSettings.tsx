'use client';
import { useState } from 'react';
import FormField from '@/components/ui/FormField';

interface Props { onSave?: (s: any) => void; }

export default function AIAccessSettings({ onSave }: Props) {
  const [model, setModel] = useState('claude-3-sonnet');
  const [enabled, setEnabled] = useState(true);
  const [maxTokens, setMaxTokens] = useState(4096);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">AI Настройки</h3>
      <FormField label="AI Ассистент">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm">Включить AI ассистент</span>
        </label>
      </FormField>
      <FormField label="Модель">
        <select value={model} onChange={e => setModel(e.target.value)} className="input-field" disabled={!enabled}>
          <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
        </select>
      </FormField>
      <FormField label="Макс. токенов">
        <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} className="input-field w-32" min={256} max={32768} disabled={!enabled} />
      </FormField>
      <button onClick={() => onSave?.({ model, enabled, maxTokens })} className="btn-primary" disabled={!enabled}>Сохранить</button>
    </div>
  );
}
