'use client';
import AuditCardModal from '@/components/AuditCardModal';
import { useState } from 'react';
import AuditCreateModal from '@/components/AuditCreateModal';
import { PageLayout, FilterBar, Pagination, StatusBadge, EmptyState } from '@/components/ui';
import { useAuditsData } from '@/hooks/useSWRData';
import { auditsApi } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';

const ST: Record<string, string> = { draft: 'Запланирован', in_progress: 'В процессе', completed: 'Завершён' };
const SC: Record<string, string> = { draft: 'bg-gray-400', in_progress: 'bg-orange-500', completed: 'bg-green-500' };
const BC: Record<string, string> = { draft: 'border-l-gray-300', in_progress: 'border-l-orange-500', completed: 'border-l-green-500' };

export default function AuditsPage() {
  const { isAuthority } = useAuth();
  const [sf, setSf] = useState<string|undefined>();
  const { data, isLoading, mutate } = useAuditsData({ status: sf });
  const audits = data?.items || [];

  return (
    <PageLayout title="Аудиты" subtitle={isLoading ? 'Загрузка...' : `Всего: ${data?.total || 0}`}>
      <FilterBar value={sf} onChange={setSf} className="mb-4"
        options={[{ value: undefined, label: 'Все' }, ...Object.entries(ST).map(([v, l]) => ({ value: v, label: l }))]} />
      {isLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : audits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {audits.map((a: any) => (
            <div key={a.id} className={`card p-5 border-l-4 ${BC[a.status] || 'border-l-gray-300'} flex justify-between items-center`}>
              <div>
                <div className="font-bold">Аудит #{a.id.slice(0,8)}</div>
                <div className="text-xs text-gray-500 mt-1">ВС: {a.aircraft_id?.slice(0,8)||'—'} {a.planned_at && `· ${new Date(a.planned_at).toLocaleDateString('ru-RU')}`}</div>
              </div>
              <div className="flex gap-2 items-center">
                <StatusBadge status={a.status} colorMap={SC} labelMap={ST} />
                {a.status === 'in_progress' && isAuthority && (
                  <button onClick={async () => { await auditsApi.complete(a.id); mutate(); }} className="btn-sm bg-green-500 text-white">Завершить</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState message="Нет аудитов." />}
    </PageLayout>
  );
}
