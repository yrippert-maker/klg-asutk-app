'use client';
import { useState, useEffect } from 'react';
import { Modal, StatusBadge } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; user: any; onSave?: (data: any) => void; }

const roles = ['admin', 'authority_inspector', 'operator_manager', 'operator_user', 'mro_manager', 'mro_user'];
const RL: Record<string,string> = { admin:'Администратор', authority_inspector:'Инспектор', operator_manager:'Менеджер оператора', operator_user:'Оператор', mro_manager:'Менеджер ТОиР', mro_user:'Специалист ТОиР' };

export default function UserEditModal({ isOpen, onClose, user, onSave }: Props) {
  const [form, setForm] = useState({ display_name: '', email: '', role: 'operator_user' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (user) setForm({ display_name: user.display_name || '', email: user.email || '', role: user.role || 'operator_user' }); }, [user]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user?.display_name || 'Пользователь'} size="md"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button>{onSave && <button onClick={() => onSave(form)} className="btn-primary">Сохранить</button>}</>}>
      <FormField label="Имя" required><input value={form.display_name} onChange={e => set('display_name', e.target.value)} className="input-field" /></FormField>
      <FormField label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" /></FormField>
      <FormField label="Роль"><select value={form.role} onChange={e => set('role', e.target.value)} className="input-field">{roles.map(r => <option key={r} value={r}>{RL[r]}</option>)}</select></FormField>
    </Modal>
  );
}
