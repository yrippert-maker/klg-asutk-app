'use client';
import OrganizationDetailsModal from '@/components/OrganizationDetailsModal';
import { useState } from 'react';
import { PageLayout, Pagination, EmptyState } from '@/components/ui';
import OrganizationCreateModal from '@/components/OrganizationCreateModal';
import OrganizationEditModal from '@/components/OrganizationEditModal';
import { useOrganizationsData } from '@/hooks/useSWRData';
import { organizationsApi } from '@/lib/api/api-client';
import { RequireRole } from '@/lib/auth-context';

const KIND: Record<string, string> = { operator: '✈️ Оператор', mro: '🔧 ТОиР', authority: '🏛️ Орган власти' };

export default function OrganizationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, mutate } = useOrganizationsData({ q: search || undefined, page, per_page: 25 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);

  const orgs = data?.items || [];

  const handleCreate = async (d: any) => { try { await organizationsApi.create(d); mutate(); setIsCreateOpen(false); } catch (e: any) { alert(e.message); } };
  const handleSave = async (d: any) => { if (!editingOrg?.id) return; try { await organizationsApi.update(editingOrg.id, d); mutate(); setIsEditOpen(false); } catch (e: any) { alert(e.message); } };
  const handleDelete = async (id: string) => { if (!confirm('Удалить?')) return; try { await organizationsApi.delete(id); mutate(); } catch (e: any) { alert(e.message); } };

  return (
    <PageLayout title="Организации" subtitle={isLoading ? 'Загрузка...' : `Всего: ${data?.total || 0}`}
      actions={<>
        <input type="text" placeholder="Поиск..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field w-60" />
        <RequireRole roles={['admin', 'authority_inspector']}><button onClick={() => setIsCreateOpen(true)} className="btn-primary">Добавить</button></RequireRole>
      </>}>
      {isLoading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : orgs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orgs.map((org: any) => (
            <div key={org.id} className="card p-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{org.name}</h3>
                <p className="text-sm text-gray-500">{KIND[org.kind] || org.kind}{org.inn && ` · ИНН: ${org.inn}`}{org.address && ` · ${org.address}`}</p>
              </div>
              <div className="flex gap-2">
                <RequireRole roles={['admin', 'authority_inspector']}>
                  <button onClick={() => { setEditingOrg(org); setIsEditOpen(true); }} className="btn-sm bg-primary-500 text-white">Ред.</button>
                  <button onClick={() => handleDelete(org.id)} className="btn-sm bg-red-500 text-white">Удал.</button>
                </RequireRole>
              </div>
            </div>
          ))}
          <Pagination page={page} pages={data?.pages || 1} onPageChange={setPage} />
        </div>
      ) : <EmptyState message={`Организации не найдены.${search ? ' Попробуйте другой запрос.' : ''}`} />}
      <OrganizationCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreate} />
      <OrganizationEditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} organization={editingOrg} onSave={handleSave} />
    </PageLayout>
  );
}
