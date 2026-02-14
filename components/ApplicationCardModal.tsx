'use client';
import { useState, useEffect } from 'react';
import { Modal, StatusBadge } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; application: any; onSave?: (data: any) => void; }

export default function ApplicationCardModal({ isOpen, onClose, application, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (application) setForm({ ...application }); }, [application]);
  if (!application) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={application.number || 'Заявка'} size="lg"
      footer={<>
        <button onClick={onClose} className="btn-secondary">Закрыть</button>
        {editing ? <button onClick={() => { onSave?.(form); setEditing(false); }} className="btn-primary">Сохранить</button>
          : onSave && <button onClick={() => setEditing(true)} className="btn-primary">Редактировать</button>}
      </>}>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><StatusBadge status={application.status} /></div>
        {editing ? (
          <div className="space-y-3">
            <FormField label="Тема"><input value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field" /></FormField>
            <FormField label="Описание"><textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field h-24" /></FormField>
            <FormField label="Комментарии"><textarea value={form.comments || ''} onChange={e => setForm({ ...form, comments: e.target.value })} className="input-field h-20" /></FormField>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-bold text-gray-600">Тема:</span> {application.subject || '—'}</div>
            <div><span className="font-bold text-gray-600">Организация:</span> {application.applicant_org_name || application.organization || '—'}</div>
            <div><span className="font-bold text-gray-600">ВС:</span> {application.aircraft || '—'}</div>
            <div><span className="font-bold text-gray-600">Дата:</span> {application.created_at ? new Date(application.created_at).toLocaleDateString('ru-RU') : application.date || '—'}</div>
            {application.description && <div className="col-span-2 p-3 bg-gray-50 rounded">{application.description}</div>}
            {application.comments && <div className="col-span-2 p-3 bg-yellow-50 rounded"><span className="font-bold text-gray-600">Комментарии:</span> {application.comments}</div>}
          </div>
        )}
      </div>
    </Modal>
  );
}
