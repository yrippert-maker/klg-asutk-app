'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import { StatusBadge } from '@/components/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  risk: any;
  onEdit?: (risk: any) => void;
  onCloseRisk?: (id: string) => void;
}

const SEV_LABELS: Record<string, string> = { critical: 'Критический', high: 'Высокий', medium: 'Средний', low: 'Низкий' };
const STATUS_LABELS: Record<string, string> = { open: 'Открыт', mitigating: 'Меры в работе', resolved: 'Устранён', accepted: 'Принят' };

export default function RiskDetailModal({ isOpen, onClose, risk, onEdit, onCloseRisk }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!risk) return;
    setDownloading(true);
    const report = [
      `Отчёт по риску`,
      `ID: ${risk.id || '—'}`,
      `Название: ${risk.title || '—'}`,
      `Описание: ${risk.description || '—'}`,
      `Категория: ${risk.category || '—'}`,
      `Вероятность: ${risk.probability ?? '—'}`,
      `Последствия: ${risk.impact ?? risk.consequences ?? '—'}`,
      `Уровень риска: ${risk.severity || risk.level || '—'} (${SEV_LABELS[risk.severity] || risk.severity})`,
      `Статус: ${STATUS_LABELS[risk.status] || risk.status}`,
      `Мероприятия по снижению: ${risk.mitigation ?? risk.mitigation_actions ?? '—'}`,
      `Ответственный: ${risk.responsible ?? risk.owner ?? '—'}`,
      `Срок: ${risk.due_date ?? risk.due ?? '—'}`,
      `Дата создания: ${risk.created_at ? new Date(risk.created_at).toLocaleDateString('ru-RU') : '—'}`,
      '',
      'История изменений:',
      ...(Array.isArray(risk.history) ? risk.history.map((h: any) => `  ${h.date || ''} — ${h.action || h.comment || ''}`) : ['  Нет данных']),
    ].join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `risk_${(risk.id || 'report').toString().slice(0, 8)}.txt`; a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  if (!risk) return null;

  const history = risk.history || [
    { date: risk.created_at, action: 'Риск зарегистрирован' },
    ...(risk.updated_at ? [{ date: risk.updated_at, action: 'Обновление' }] : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={risk.title || 'Риск'}
      size="lg"
      footer={
        <div className="flex gap-2 flex-wrap">
          {onEdit && <button onClick={() => { onEdit(risk); onClose(); }} className="btn-secondary">Редактировать</button>}
          <button onClick={handleDownload} disabled={downloading} className="btn-primary">Скачать отчёт</button>
          {onCloseRisk && risk.status !== 'resolved' && risk.status !== 'accepted' && (
            <button onClick={() => { if (confirm('Закрыть риск?')) { onCloseRisk(risk.id); onClose(); } }} className="btn-sm bg-gray-200 text-gray-700">Закрыть</button>
          )}
          <button onClick={onClose} className="btn-secondary">Закрыть</button>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <div><span className="text-gray-500">Описание</span><p className="mt-1">{risk.description || '—'}</p></div>
        <div className="grid grid-cols-2 gap-3">
          <div><span className="text-gray-500">Категория</span><p className="mt-1">{risk.category || '—'}</p></div>
          <div><span className="text-gray-500">Вероятность</span><p className="mt-1">{risk.probability ?? '—'}</p></div>
          <div><span className="text-gray-500">Последствия</span><p className="mt-1">{risk.impact ?? risk.consequences ?? '—'}</p></div>
          <div><span className="text-gray-500">Уровень риска</span><p className="mt-1"><StatusBadge status={risk.severity} colorMap={{ critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' }} labelMap={SEV_LABELS} /></p></div>
        </div>
        <div>
          <span className="text-gray-500">Мероприятия по снижению</span>
          <p className="mt-1">{risk.mitigation ?? risk.mitigation_actions ?? '—'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><span className="text-gray-500">Ответственный</span><p className="mt-1">{risk.responsible ?? risk.owner ?? '—'}</p></div>
          <div><span className="text-gray-500">Срок</span><p className="mt-1">{risk.due_date ?? risk.due ? new Date(risk.due_date || risk.due).toLocaleDateString('ru-RU') : '—'}</p></div>
          <div><span className="text-gray-500">Статус</span><p className="mt-1"><StatusBadge status={risk.status} colorMap={{ open: 'bg-red-500', mitigating: 'bg-yellow-500', resolved: 'bg-green-500', accepted: 'bg-gray-400' }} labelMap={STATUS_LABELS} /></p></div>
        </div>
        <div>
          <h4 className="font-medium text-gray-700 mb-2">История изменений</h4>
          <ul className="space-y-1 text-gray-600">
            {history.map((h: any, i: number) => (
              <li key={i}>{h.date ? new Date(h.date).toLocaleString('ru-RU') : ''} — {h.action || h.comment || '—'}</li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
