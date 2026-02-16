'use client';
import { useState } from 'react';
import UserEditModal from '@/components/UserEditModal';
import { PageLayout, DataTable, FilterBar, StatusBadge } from '@/components/ui';
import { useUsersData } from '@/hooks/useSWRData';

const RL: Record<string,string> = { admin:'Администратор', authority_inspector:'Инспектор', operator_manager:'Менеджер оператора', operator_user:'Оператор', mro_manager:'Менеджер ТОиР', mro_specialist:'Специалист ТОиР', mro_user:'Специалист ТОиР' };
const RC: Record<string,string> = { admin:'bg-green-500', authority_inspector:'bg-blue-500', operator_manager:'bg-orange-500', operator_user:'bg-orange-400', mro_manager:'bg-purple-500', mro_specialist:'bg-purple-400', mro_user:'bg-purple-400' };

export default function UsersPage() {
  const [rf, setRf] = useState<string|undefined>();
  const { data, isLoading } = useUsersData({ role: rf });

  return (
    <PageLayout title="Пользователи" subtitle={isLoading ? 'Загрузка...' : `Всего: ${data?.total || 0}`}>
      <FilterBar value={rf} onChange={setRf} options={[{ value: undefined, label: 'Все' }, ...Object.entries(RL).map(([v, l]) => ({ value: v, label: l }))]} className="mb-4" />
      <DataTable loading={isLoading} data={Array.isArray(data?.items) ? data.items : []} emptyMessage="Нет пользователей"
        columns={[
          { key: 'display_name', header: 'Имя', render: (u: any) => <span className="font-medium">{u.display_name}</span> },
          { key: 'email', header: 'Email', render: (u: any) => <span className="text-gray-500">{u.email || '—'}</span> },
          { key: 'role', header: 'Роль', render: (u: any) => <StatusBadge status={u.role} colorMap={RC} labelMap={RL} /> },
          { key: 'organization_name', header: 'Организация', render: (u: any) => <span className="text-gray-500">{u.organization_name || '—'}</span> },
        ]} />
    </PageLayout>
  );
}
