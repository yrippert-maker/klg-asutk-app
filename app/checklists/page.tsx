'use client';
import ChecklistCardModal from '@/components/ChecklistCardModal';
import ChecklistEditModal from '@/components/ChecklistEditModal';
import { useState } from 'react';
import ChecklistCreateModal from '@/components/ChecklistCreateModal';
import { PageLayout, FilterBar, EmptyState } from '@/components/ui';
import { useChecklistsData } from '@/hooks/useSWRData';
import { checklistsApi } from '@/lib/api/api-client';
import { RequireRole } from '@/lib/auth-context';

export default function ChecklistsPage() {
  const [domain, setDomain] = useState<string | undefined>();
  const { data, isLoading, mutate } = useChecklistsData({ domain: domain === 'part_m_ru' ? undefined : domain });
  const templates = data?.items || [];
  const [exp, setExp] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<any | null>(null);

  const gen = async (src: string) => { const n = prompt('Название:'); if (!n) return; await checklistsApi.generate(src, n); mutate(); };

  return (
    <PageLayout title="Чек-листы Part-M RU" subtitle={isLoading ? 'Загрузка...' : (data?.total ? `Part-M RU · Гармонизировано с ICAO Annex 8 · EASA Part-M · Шаблонов: ${data.total}` : 'Part-M RU · Гармонизировано с ICAO Annex 8 · EASA Part-M')}
      actions={<RequireRole roles={['admin', 'authority_inspector']}>
        <button onClick={() => gen('fap_m_inspection')} className="btn-primary">+ ФАП-М</button>
        <button onClick={() => gen('custom')} className="btn-primary bg-blue-500 hover:bg-blue-600">+ Пользовательский</button>
      </RequireRole>}>
      <FilterBar value={domain} onChange={setDomain} className="mb-4"
        options={[
          { value: undefined, label: 'Все' },
          { value: 'part_m_ru', label: 'Part-M RU' },
        ]} />
      {!isLoading && templates.length > 0 ? (
        <div className="flex flex-col gap-3">
          {templates.map((t: any) => (
            <div key={t.id} className="card">
              <div className="p-5 flex justify-between items-center cursor-pointer" onClick={() => setExp(exp === t.id ? null : t.id)}>
                <div><div className="font-bold">{t.name}</div><div className="text-xs text-gray-500">{t.domain || '—'} · v{t.version || 1} · {t.items?.length || 0} пунктов</div></div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <RequireRole roles={['admin', 'authority_inspector']}>
                    <button type="button" onClick={() => setEditTemplate(t)} className="rounded px-2 py-1 text-sm hover:bg-gray-100" title="Редактировать">✏️ Редактировать</button>
                  </RequireRole>
                  <span className="text-lg">{exp === t.id ? '▼' : '▶'}</span>
                </div>
              </div>
              {exp === t.id && t.items?.length > 0 && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  {t.items.map((it: any, i: number) => (
                    <div key={it.id || i} className="py-2 border-b border-gray-50 flex gap-3">
                      <span className="text-xs font-bold text-primary-500 min-w-[80px]">{it.code}</span>
                      <span className="text-sm">{it.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !isLoading ? <EmptyState message="Нет шаблонов. Создайте через кнопку выше." /> : null}
      {editTemplate && (
        <ChecklistEditModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
          onSaved={() => mutate()}
        />
      )}
    </PageLayout>
  );
}
