/**
 * Regulations page — loads from /api/regulations.
 * Разработчик: АО «REFLY»
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageLayout, FilterBar, StatusBadge, EmptyState } from '@/components/ui';
import RegulationViewModal from '@/components/RegulationViewModal';

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/regulations');
        const data = await r.json();
        setRegulations(Array.isArray(data) ? data : data?.documents || data?.data || []);
      } catch { setRegulations([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const sources = useMemo(() => [...new Set(regulations.map(r => r.source).filter(Boolean))], [regulations]);
  const filtered = sourceFilter ? regulations.filter(r => r.source === sourceFilter) : regulations;

  return (
    <PageLayout title="Нормативные документы" subtitle={loading ? 'Загрузка...' : `Документов: ${filtered.length}`}>
      <FilterBar value={sourceFilter} onChange={setSourceFilter} className="mb-4"
        options={[{ value: undefined, label: 'Все' }, ...sources.map(s => ({ value: s, label: s }))]} />
      {loading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((reg: any) => (
            <div key={reg.id || reg.number} className="card p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(reg)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-primary-100 text-primary-700">{reg.source || '—'}</span>
                  <span className="text-xs text-gray-400">{reg.number}</span>
                </div>
                <div className="font-medium text-sm truncate">{reg.title || reg.name}</div>
                {reg.type && <div className="text-xs text-gray-500 mt-1">Тип: {reg.type}</div>}
              </div>
              <span className="text-gray-300 ml-4">▶</span>
            </div>
          ))}
        </div>
      ) : <EmptyState message="Нет документов." />}
      <RegulationViewModal isOpen={!!selected} onClose={() => setSelected(null)} regulation={selected} />
    </PageLayout>
  );
}
