'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, StatCard } from '@/components/ui';
import { healthApi, auditLogApi } from '@/lib/api/api-client';

export default function MonitoringPage() {
  const [health, setHealth] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [h, l] = await Promise.all([healthApi.check().catch(() => ({ status: 'unreachable' })), auditLogApi.list({ per_page: 20 }).catch(() => ({ items: [] }))]);
      setHealth(h); setLogs(l?.items || []); setLoading(false);
    };
    load(); const iv = setInterval(load, 30000); return () => clearInterval(iv);
  }, []);

  return (
    <PageLayout title="Мониторинг" subtitle={loading ? 'Загрузка...' : undefined}>
      {!loading && <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Статус" value={health?.status || '—'} border={health?.status === 'ok' ? 'border-l-green-500' : 'border-l-red-500'} />
          <StatCard label="БД" value={health?.db || '—'} border={health?.db === 'ok' ? 'border-l-green-500' : 'border-l-red-500'} />
          <StatCard label="WS подкл." value={`${health?.ws_active_connections || 0}`} border="border-l-blue-500" />
          <StatCard label="WS юзеров" value={`${health?.ws_active_users || 0}`} border="border-l-blue-500" />
        </div>
        <h3 className="text-lg font-bold mb-3">Последние события</h3>
        <DataTable data={logs} emptyMessage="Нет событий" columns={[
          { key: 'created_at', header: 'Время', render: (l: any) => <span className="text-xs">{l.created_at ? new Date(l.created_at).toLocaleString('ru-RU') : '—'}</span> },
          { key: 'action', header: 'Действие', render: (l: any) => <span className={`badge ${l.action === 'create' ? 'bg-green-100 text-green-700' : l.action === 'delete' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{l.action}</span> },
          { key: 'entity_type', header: 'Объект', className: 'text-xs' },
          { key: 'user_email', header: 'Пользователь', className: 'text-xs' },
          { key: 'description', header: 'Описание', className: 'text-xs text-gray-500' },
        ]} />
      </>}
    </PageLayout>
  );
}
