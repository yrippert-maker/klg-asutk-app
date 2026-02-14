'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState } from '@/components/ui';

export default function ModificationsPage() {
  const [mods, setMods] = useState([] as any[]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true); fetch('/api/v1/modifications').then(r => r.json()).then(d => { setMods(d.items || []); setLoading(false); }); }, []);
  return (
    <>
    {loading && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="text-gray-500">⏳ Загрузка...</div></div>}
      <PageLayout title="⚙️ Модификации ВС" subtitle="ФАП-21; EASA Part-21.A.97; ICAO Annex 8">
      {mods.length > 0 ? (
        <DataTable columns={[
          { key: 'number', label: '№' },
          { key: 'title', label: 'Наименование' },
          { key: 'aircraft_reg', label: 'Борт' },
          { key: 'mod_type', label: 'Тип' },
          { key: 'status', label: 'Статус', render: (v: string) => (
            <StatusBadge status={v} colorMap={{ pending: 'bg-yellow-500', approved: 'bg-green-500', incorporated: 'bg-blue-500', rejected: 'bg-red-500' }} />
          )},
        ]} data={mods} />
      ) : <EmptyState message="Нет модификаций" />}
    </PageLayout>
    </>
  );
}
