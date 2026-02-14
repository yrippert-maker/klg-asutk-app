'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; onAdd: (data: any) => void; }

export default function AircraftAddModal({ isOpen, onClose, onAdd }: Props) {
  const [form, setForm] = useState({ registration_number: '', serial_number: '', aircraft_type: '', model: '', operator_id: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = () => { if (!form.registration_number.trim()) return alert('Укажите регистрацию'); onAdd(form); setForm({ registration_number: '', serial_number: '', aircraft_type: '', model: '', operator_id: '' }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить ВС" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={handleAdd} className="btn-primary">Добавить</button></>}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Регистрация" required><input value={form.registration_number} onChange={e => set('registration_number', e.target.value)} className="input-field" placeholder="RA-XXXXX" /></FormField>
        <FormField label="Серийный номер"><input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} className="input-field" /></FormField>
        <FormField label="Тип ВС"><input value={form.aircraft_type} onChange={e => set('aircraft_type', e.target.value)} className="input-field" placeholder="Boeing 737-800" /></FormField>
        <FormField label="Модель"><input value={form.model} onChange={e => set('model', e.target.value)} className="input-field" /></FormField>
      </div>
    </Modal>
  );
}
