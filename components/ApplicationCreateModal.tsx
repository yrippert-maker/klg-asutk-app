'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void; }

export default function ApplicationCreateModal({ isOpen, onClose, onCreate }: Props) {
  const [form, setForm] = useState({ number: '', type: 'Регистрация ВС', subject: '', aircraft: '', organization: '', description: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    if (!form.subject.trim()) return alert('Укажите тему');
    onCreate({ ...form, number: form.number || `APP-${Date.now()}`, status: 'draft', date: new Date().toISOString().slice(0, 10) });
    setForm({ number: '', type: 'Регистрация ВС', subject: '', aircraft: '', organization: '', description: '' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать заявку" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={handleCreate} className="btn-primary">Создать</button></>}>
      <FormField label="Тема" required><input value={form.subject} onChange={e => set('subject', e.target.value)} className="input-field" placeholder="Тема заявки" /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Тип"><select value={form.type} onChange={e => set('type', e.target.value)} className="input-field"><option>Регистрация ВС</option><option>Сертификация</option><option>Модификация</option><option>Другое</option></select></FormField>
        <FormField label="ВС"><input value={form.aircraft} onChange={e => set('aircraft', e.target.value)} className="input-field" placeholder="RA-XXXXX" /></FormField>
      </div>
      <FormField label="Организация"><input value={form.organization} onChange={e => set('organization', e.target.value)} className="input-field" /></FormField>
      <FormField label="Описание"><textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-field h-24" placeholder="Подробности заявки..." /></FormField>
    </Modal>
  );
}
