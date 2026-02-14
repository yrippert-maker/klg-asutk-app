'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState } from '@/components/ui';

export default function ApplicationsPage() {
  const [apps, setApps] = useState([] as any[]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true); fetch('/api/v1/cert-applications').then(r => r.json()).then(d => { setApps(d.items || []); setLoading(false); }); }, []);
  return (
    <>
    {loading && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="text-gray-500">⏳ Загрузка...</div></div>}
      <PageLayout title="📋 Заявки на сертификацию" subtitle="ФАП-246; EASA Part-ORO; ICAO Annex 6">
      {apps.length > 0 ? (
        <DataTable columns={[
          { key: 'number', label: '№ заявки' },
          { key: 'type', label: 'Тип' },
          { key: 'organization_name', label: 'Организация' },
          { key: 'status', label: 'Статус', render: (v: string) => (
            <StatusBadge status={v} colorMap={{ pending: 'bg-yellow-500', approved: 'bg-green-500', rejected: 'bg-red-500', draft: 'bg-gray-400' }}
              labelMap={{ pending: 'На рассмотрении', approved: 'Одобрена', rejected: 'Отклонена', draft: 'Черновик' }} />
          )},
          { key: 'submitted_at', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
        ]} data={apps} />
      ) : <EmptyState message="Нет заявок" />}
    </PageLayout>
    </>
  );
}
