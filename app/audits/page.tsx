'use client';
import { useState } from 'react';
import AuditEditModal from '@/components/AuditEditModal';
import { PageLayout, FilterBar, StatusBadge, EmptyState } from '@/components/ui';
import { useAuditsData } from '@/hooks/useSWRData';
import { auditsApi } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';

const ST: Record<string, string> = { draft: 'Запланирован', in_progress: 'В процессе', completed: 'Завершён' };
const SC: Record<string, string> = { draft: 'bg-gray-400', in_progress: 'bg-orange-500', completed: 'bg-green-500' };
const BC: Record<string, string> = { draft: 'border-l-gray-300', in_progress: 'border-l-orange-500', completed: 'border-l-green-500' };

export default function AuditsPage() {
  const { isAuthority } = useAuth();
  const [sf, setSf] = useState<string | undefined>();
  const [editingAudit, setEditingAudit] = useState<any>(null);
  const { data, isLoading, mutate } = useAuditsData({ status: sf });
  const audits = data?.items || [];

  const handleSaveAudit = async (id: string, payload: any) => {
    try {
      await auditsApi.update(id, payload);
      mutate();
      setEditingAudit(null);
    } catch (e: any) {
      alert(e?.message || 'Ошибка сохранения');
    }
  };

  return (
    <PageLayout title="Аудиты" subtitle={isLoading ? 'Загрузка...' : `Всего: ${data?.total || 0}`}>
      <FilterBar value={sf} onChange={setSf} className="mb-4"
        options={[{ value: undefined, label: 'Все' }, ...Object.entries(ST).map(([v, l]) => ({ value: v, label: l }))]} />
      {isLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : audits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {audits.map((a: any) => (
            <div key={a.id} className={`card p-5 border-l-4 ${BC[a.status] || 'border-l-gray-300'} flex justify-between items-center`}>
              <div>
                <div className="font-bold">Аудит #{a.id.slice(0, 8)}</div>
                <div className="text-xs text-gray-500 mt-1">ВС: {a.aircraft_id?.slice(0, 8) || '—'} {a.planned_at && `· ${new Date(a.planned_at).toLocaleDateString('ru-RU')}`}</div>
              </div>
              <div className="flex gap-2 items-center">
                <StatusBadge status={a.status} colorMap={SC} labelMap={ST} />
                <button onClick={() => setEditingAudit(a)} className="btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded" title="Редактировать">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                {a.status === 'in_progress' && isAuthority && (
                  <button onClick={async () => { await auditsApi.complete(a.id); mutate(); }} className="btn-sm bg-green-500 text-white">Завершить</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState message="Нет аудитов." />}
      <AuditEditModal isOpen={!!editingAudit} onClose={() => setEditingAudit(null)} audit={editingAudit} onSave={handleSaveAudit} />
    </PageLayout>
  );
}
