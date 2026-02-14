'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void; templates?: any[]; aircraft?: any[]; }

export default function AuditCreateModal({ isOpen, onClose, onCreate, templates = [], aircraft = [] }: Props) {
  const [form, setForm] = useState({ aircraft_id: '', template_id: '', planned_at: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать аудит" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={() => { if (!form.aircraft_id) return alert('Укажите ВС'); onCreate(form); }} className="btn-primary">Создать</button></>}>
      <FormField label="Воздушное судно" required>
        <select value={form.aircraft_id} onChange={e => set('aircraft_id', e.target.value)} className="input-field">
          <option value="">— Выберите ВС —</option>
          {aircraft.map((a: any) => <option key={a.id} value={a.id}>{a.registrationNumber || a.id.slice(0, 8)}</option>)}
        </select>
      </FormField>
      <FormField label="Шаблон">
        <select value={form.template_id} onChange={e => set('template_id', e.target.value)} className="input-field">
          <option value="">— Без шаблона —</option>
          {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </FormField>
      <FormField label="Плановая дата"><input type="date" value={form.planned_at} onChange={e => set('planned_at', e.target.value)} className="input-field" /></FormField>
    </Modal>
  );
}
