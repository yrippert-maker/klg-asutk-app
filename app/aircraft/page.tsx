'use client';
import { useState } from 'react';
import { PageLayout, Pagination, StatusBadge, EmptyState } from '@/components/ui';
import AircraftAddModal from '@/components/AircraftAddModal';
import AircraftEditModal from '@/components/AircraftEditModal';
import { useAircraftData } from '@/hooks/useSWRData';
import { aircraftApi } from '@/lib/api/api-client';
import { RequireRole } from '@/lib/auth-context';

export default function AircraftPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<any>(null);
  const { data, isLoading, mutate } = useAircraftData({ q: search || undefined, page, limit: 25 });
  const aircraft = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  const total = data?.total ?? aircraft.length;
  const pages = data?.pages ?? 1;

  const typeLabel = (a: any) => {
    const t = a?.aircraft_type;
    if (!t) return '—';
    return [t.manufacturer, t.model].filter(Boolean).join(' ') || t.icao_code || '—';
  };

  const handleAdd = async (d: any) => { try { await aircraftApi.create(d); mutate(); setIsAddOpen(false); } catch (e: any) { alert(e.message); } };
  const handleSave = async (id: string, d: any) => { try { await aircraftApi.update(id, d); mutate(); setEditingAircraft(null); } catch (e: any) { alert(e.message); } };
  const handleDelete = async (id: string) => { if (!confirm('Удалить ВС?')) return; try { await aircraftApi.delete(id); mutate(); } catch (e: any) { alert(e.message); } };

  return (
    <PageLayout title="Воздушные суда" subtitle={isLoading ? 'Загрузка...' : `Всего: ${total}`}
      actions={<>
        <input type="text" placeholder="Поиск..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field w-60" />
        <RequireRole roles={['admin', 'authority_inspector', 'operator_manager']}>
          <button onClick={() => setIsAddOpen(true)} className="btn-primary">+ Добавить ВС</button>
        </RequireRole>
      </>}>
      {isLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : aircraft.length > 0 ? (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50">
                <th className="table-header">Регистрация</th><th className="table-header">Тип</th><th className="table-header">Оператор</th>
                <th className="table-header">Серийный №</th><th className="table-header">Налёт (ч)</th><th className="table-header">Статус</th>
                <th className="table-header">Действия</th>
              </tr></thead>
              <tbody>
                {aircraft.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell font-medium text-primary-500">{a.registration_number ?? a.registrationNumber ?? '—'}</td>
                    <td className="table-cell">{typeLabel(a)}</td>
                    <td className="table-cell text-gray-500">{a.operator_name ?? a.operator ?? '—'}</td>
                    <td className="table-cell text-gray-500 font-mono text-sm">{a.serial_number ?? '—'}</td>
                    <td className="table-cell text-right font-mono">{a.total_time ?? a.flight_hours ?? a.flightHours ?? '—'}</td>
                    <td className="table-cell"><StatusBadge status={a.status ?? a.current_status ?? 'active'} /></td>
                    <td className="table-cell">
                      <RequireRole roles={['admin', 'authority_inspector', 'operator_manager']}>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingAircraft(a)} className="btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded" title="Редактировать" aria-label="Редактировать">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="btn-sm bg-red-100 text-red-600 hover:bg-red-200">Удалить</button>
                        </div>
                      </RequireRole>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </>
      ) : <EmptyState message={`ВС не найдены.${search ? ' Измените поиск.' : ''}`} />}
      <AircraftAddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleAdd} />
      <AircraftEditModal isOpen={!!editingAircraft} onClose={() => setEditingAircraft(null)} aircraft={editingAircraft} onSave={handleSave} />
    </PageLayout>
  );
}
