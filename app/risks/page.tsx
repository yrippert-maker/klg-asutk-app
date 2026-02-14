'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState } from '@/components/ui';

export default function RisksPage() {
  const [risks, setRisks] = useState([] as any[]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    setLoading(true);
    const url = '/api/v1/risk-alerts' + (filter ? '?severity=' + filter : '');
    fetch(url).then(r => r.json()).then(d => { setRisks(d.items || []); });
  }, [filter]);
  return (
    <>
    {loading && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="text-gray-500">⏳ Загрузка...</div></div>}
      <PageLayout title="⚠️ Управление рисками" subtitle="ICAO Annex 19; ВК РФ ст. 24.1; ICAO Doc 9859">
      <div className="flex gap-2 mb-4">
        {['', 'critical', 'high', 'medium', 'low'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{s || 'Все'}</button>
        ))}
      </div>
      {risks.length > 0 ? (
        <DataTable columns={[
          { key: 'title', label: 'Риск' },
          { key: 'severity', label: 'Серьёзность', render: (v: string) => (
            <StatusBadge status={v} colorMap={{ critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-green-500' }} />
          )},
          { key: 'category', label: 'Категория' },
          { key: 'status', label: 'Статус', render: (v: string) => (
            <StatusBadge status={v} colorMap={{ open: 'bg-red-500', mitigating: 'bg-yellow-500', resolved: 'bg-green-500', accepted: 'bg-gray-400' }}
              labelMap={{ open: 'Открыт', mitigating: 'Меры', resolved: 'Устранён', accepted: 'Принят' }} />
          )},
          { key: 'created_at', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
        ]} data={risks} />
      ) : <EmptyState message="Нет зарегистрированных рисков" />}
    </PageLayout>
    </>
  );
}
