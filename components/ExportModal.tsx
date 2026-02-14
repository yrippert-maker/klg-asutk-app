'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; }

const formats = ['xlsx', 'csv', 'pdf', 'json'];
const datasets = ['aircraft', 'organizations', 'cert_applications', 'risk_alerts', 'audits', 'checklists', 'maintenance_tasks'];
const datasetLabels: Record<string, string> = { aircraft: 'ВС', organizations: 'Организации', cert_applications: 'Заявки', risk_alerts: 'Риски', audits: 'Аудиты', checklists: 'Чек-листы', maintenance_tasks: 'Задачи ТО' };

export default function ExportModal({ isOpen, onClose }: Props) {
  const [format, setFormat] = useState('xlsx');
  const [selected, setSelected] = useState<string[]>(['aircraft']);

  const toggle = (ds: string) => setSelected(prev => prev.includes(ds) ? prev.filter(s => s !== ds) : [...prev, ds]);

  const handleExport = () => {
    alert(`Экспорт: ${selected.join(', ')} в формате ${format.toUpperCase()}\n\nВ production это вызовет /api/v1/export endpoint.`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Экспорт данных" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={handleExport} disabled={!selected.length} className="btn-primary disabled:opacity-50">Экспортировать</button></>}>
      <FormField label="Формат">
        <div className="flex gap-2">
          {formats.map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded text-sm border cursor-pointer ${format === f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-300'}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="Данные для экспорта">
        <div className="space-y-2">
          {datasets.map(ds => (
            <label key={ds} className="flex items-center gap-3 cursor-pointer py-1">
              <input type="checkbox" checked={selected.includes(ds)} onChange={() => toggle(ds)} className="w-4 h-4" />
              <span className="text-sm">{datasetLabels[ds] || ds}</span>
            </label>
          ))}
        </div>
      </FormField>
    </Modal>
  );
}
