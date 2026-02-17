'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState, Modal } from '@/components/ui';

const DEMO_APPLICATIONS = [
  { id: '1', number: 'ЗАЯВ-2024-001', type: 'Сертификат эксплуатанта', organization_name: 'АО «Авиакомпания»', aircraft_id: 'RA-73001', basis: 'ФАП-246', submitted_at: '2024-10-15', status: 'pending', attachments: 'Устав, свидетельство ВС' },
  { id: '2', number: 'ЗАЯВ-2024-002', type: 'Дополнение к сертификату', organization_name: 'ООО «АвиаСервис»', aircraft_id: 'RA-73002', basis: 'ФАП-246 п. 12', submitted_at: '2024-11-01', status: 'draft', attachments: 'Регламент ТО' },
  { id: '3', number: 'ЗАЯВ-2024-003', type: 'Сертификат эксплуатанта', organization_name: 'ПАО «Авиалинии»', aircraft_id: 'VQ-BAB', basis: 'ФАП-246; EASA Part-ORO', submitted_at: '2024-09-20', status: 'approved', attachments: 'Полный пакет' },
  { id: '4', number: 'ЗАЯВ-2024-004', type: 'Сертификат на тип ВС', organization_name: 'АО «Авиакомпания»', aircraft_id: 'RA-73003', basis: 'ФАП-21', submitted_at: '2024-11-10', status: 'pending', attachments: 'Заключение по типу' },
  { id: '5', number: 'ЗАЯВ-2024-005', type: 'Продление срока действия', organization_name: 'ООО «АвиаСервис»', aircraft_id: 'RA-73002', basis: 'ФАП-246', submitted_at: '2024-08-05', status: 'approved', attachments: 'Акт проверки' },
];

const TEMPLATE_DEFAULT = {
  type: 'Сертификат эксплуатанта',
  organization_name: 'АО «Авиакомпания»',
  aircraft_id: 'RA-73001',
  basis: 'ФАП-246; ВК РФ ст. 36',
  submitted_at: new Date().toISOString().slice(0, 10),
  attachments: 'Устав, свидетельство о гос. регистрации, регламент ТО, список ВС',
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState([] as any[]);
  const [loading, setLoading] = useState(true);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [form, setForm] = useState(TEMPLATE_DEFAULT);

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/cert-applications')
      .then(r => r.json())
      .then(d => { setApps(Array.isArray(d?.items) && d.items.length > 0 ? d.items : DEMO_APPLICATIONS); setLoading(false); })
      .catch(() => { setApps(DEMO_APPLICATIONS); setLoading(false); });
  }, []);

  const handleCreateFromTemplate = () => {
    const newApp = {
      id: String(Date.now()),
      number: `ЗАЯВ-${new Date().getFullYear()}-${String(apps.length + 1).padStart(3, '0')}`,
      ...form,
      submitted_at: form.submitted_at,
      status: 'draft',
    };
    setApps(prev => [newApp, ...prev]);
    setTemplateOpen(false);
    setForm(TEMPLATE_DEFAULT);
  };

  return (
    <>
      {loading && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="text-gray-500">⏳ Загрузка...</div></div>}
      <PageLayout
        title="📋 Заявки на сертификацию"
        subtitle="ФАП-246; EASA Part-ORO; ICAO Annex 6"
        actions={<button onClick={() => { setForm(TEMPLATE_DEFAULT); setTemplateOpen(true); }} className="btn-primary">Создать по шаблону</button>}
      >
        {apps.length > 0 ? (
          <DataTable
            columns={[
              { key: 'number', label: '№ заявки' },
              { key: 'type', label: 'Тип' },
              { key: 'organization_name', label: 'Организация' },
              { key: 'aircraft_id', label: 'ВС', render: (v: string) => v || '—' },
              { key: 'status', label: 'Статус', render: (v: string) => (
                <StatusBadge status={v} colorMap={{ pending: 'bg-yellow-500', approved: 'bg-green-500', rejected: 'bg-red-500', draft: 'bg-gray-400' }}
                  labelMap={{ pending: 'На рассмотрении', approved: 'Одобрена', rejected: 'Отклонена', draft: 'Черновик' }} />
              )},
              { key: 'submitted_at', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
            ]}
            data={apps}
          />
        ) : <EmptyState message="Нет заявок" />}
      </PageLayout>

      <Modal
        isOpen={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Создать заявку по шаблону"
        size="md"
        footer={
          <>
            <button onClick={() => setTemplateOpen(false)} className="btn-secondary">Отмена</button>
            <button onClick={handleCreateFromTemplate} className="btn-primary">Создать заявку</button>
          </>
        }
      >
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-gray-600">Тип сертификата</label><input className="input-field w-full mt-1" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-gray-600">Организация</label><input className="input-field w-full mt-1" value={form.organization_name} onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-gray-600">ВС (борт / рег. номер)</label><input className="input-field w-full mt-1" value={form.aircraft_id} onChange={e => setForm(f => ({ ...f, aircraft_id: e.target.value }))} placeholder="RA-73001" /></div>
          <div><label className="text-xs font-medium text-gray-600">Основание</label><input className="input-field w-full mt-1" value={form.basis} onChange={e => setForm(f => ({ ...f, basis: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-gray-600">Дата подачи</label><input type="date" className="input-field w-full mt-1" value={form.submitted_at} onChange={e => setForm(f => ({ ...f, submitted_at: e.target.value }))} /></div>
          <div><label className="text-xs font-medium text-gray-600">Приложения</label><textarea className="input-field w-full mt-1 min-h-[80px]" value={form.attachments} onChange={e => setForm(f => ({ ...f, attachments: e.target.value }))} /></div>
        </div>
      </Modal>
    </>
  );
}
