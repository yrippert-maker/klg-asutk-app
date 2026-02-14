'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void; }

export default function OrganizationCreateModal({ isOpen, onClose, onCreate }: Props) {
  const [form, setForm] = useState({ name: '', kind: 'operator', inn: '', address: '', contact_email: '', contact_phone: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => { if (!form.name.trim()) return alert('Укажите название'); onCreate(form); setForm({ name: '', kind: 'operator', inn: '', address: '', contact_email: '', contact_phone: '' }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать организацию" size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={handleSubmit} className="btn-primary">Создать</button></>}>
      <FormField label="Название" required><input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="ООО Авиакомпания" /></FormField>
      <FormField label="Тип">
        <select value={form.kind} onChange={e => set('kind', e.target.value)} className="input-field">
          <option value="operator">Оператор</option><option value="mro">ТОиР</option><option value="authority">Орган власти</option>
        </select>
      </FormField>
      <FormField label="ИНН"><input value={form.inn} onChange={e => set('inn', e.target.value)} className="input-field" /></FormField>
      <FormField label="Адрес"><input value={form.address} onChange={e => set('address', e.target.value)} className="input-field" /></FormField>
      <FormField label="Email"><input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="input-field" /></FormField>
      <FormField label="Телефон"><input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="input-field" /></FormField>
    </Modal>
  );
}
