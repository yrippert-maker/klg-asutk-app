'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audit: any;
  onSave: (id: string, data: any) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Запланирован' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'completed', label: 'Завершён' },
];
const TYPE_OPTIONS = ['Внутренний', 'Внешний', 'Надзорный', 'По типу ВС'];

export default function AuditEditModal({ isOpen, onClose, audit, onSave }: Props) {
  const [form, setForm] = useState({
    name: '',
    audit_type: 'Внутренний',
    planned_at: '',
    auditor: '',
    status: 'draft',
    remarks: '',
    corrective_actions: '',
  });
  const [findings, setFindings] = useState<{ id: string; text: string; closed: boolean }[]>([]);
  const [newFinding, setNewFinding] = useState('');

  useEffect(() => {
    if (audit) {
      setForm({
        name: audit.name || `Аудит #${audit.id?.slice(0, 8) || ''}`,
        audit_type: audit.audit_type || 'Внутренний',
        planned_at: audit.planned_at ? new Date(audit.planned_at).toISOString().slice(0, 10) : '',
        auditor: audit.auditor || '',
        status: audit.status || 'draft',
        remarks: audit.remarks || '',
        corrective_actions: audit.corrective_actions || '',
      });
      setFindings(Array.isArray(audit.findings) ? audit.findings : [
        { id: '1', text: 'Документация по ТО не обновлена', closed: false },
        { id: '2', text: 'Отсутствует подпись в журнале учёта', closed: true },
      ]);
    }
  }, [audit]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!audit?.id) return;
    onSave(audit.id, { ...form, findings });
    onClose();
  };

  const addFinding = () => {
    if (!newFinding.trim()) return;
    setFindings(prev => [...prev, { id: String(Date.now()), text: newFinding.trim(), closed: false }]);
    setNewFinding('');
  };

  const toggleFinding = (id: string) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, closed: !f.closed } : f));
  };

  if (!audit) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактировать аудит"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Отмена</button>
          <button onClick={handleSave} className="btn-primary">Сохранить</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Название"><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" /></FormField>
          <FormField label="Тип аудита">
            <select value={form.audit_type} onChange={e => set('audit_type', e.target.value)} className="input-field">
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Дата"><input type="date" value={form.planned_at} onChange={e => set('planned_at', e.target.value)} className="input-field" /></FormField>
          <FormField label="Аудитор"><input value={form.auditor} onChange={e => set('auditor', e.target.value)} className="input-field" placeholder="ФИО" /></FormField>
          <FormField label="Статус">
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Замечания"><textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} className="input-field w-full min-h-[60px]" /></FormField>
        <FormField label="Корректирующие действия"><textarea value={form.corrective_actions} onChange={e => set('corrective_actions', e.target.value)} className="input-field w-full min-h-[60px]" /></FormField>

        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2">Чек-лист замечаний</h4>
          <div className="flex gap-2 mb-2">
            <input value={newFinding} onChange={e => setNewFinding(e.target.value)} className="input-field flex-1" placeholder="Добавить замечание" onKeyDown={e => e.key === 'Enter' && addFinding()} />
            <button type="button" onClick={addFinding} className="btn-sm bg-primary-500 text-white">Добавить</button>
          </div>
          <ul className="space-y-1">
            {findings.map(f => (
              <li key={f.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100">
                <input type="checkbox" checked={f.closed} onChange={() => toggleFinding(f.id)} className="rounded" />
                <span className={f.closed ? 'text-gray-500 line-through' : ''}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
