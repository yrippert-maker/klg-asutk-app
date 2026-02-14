'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, EmptyState } from '@/components/ui';

const ENTITY_TYPES = ['', 'aircraft', 'directive', 'bulletin', 'work_order', 'defect', 'component', 'specialist', 'maint_program', 'life_limit'];

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/audit?limit=500').then(r => r.json())
      .then(d => { setLogs(d.items || d || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    if (entityFilter && l.entity_type !== entityFilter) return false;
    if (actionFilter && !l.action?.includes(actionFilter)) return false;
    return true;
  });

  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  return (
    <PageLayout title="📝 История изменений" subtitle="Audit trail — все действия в системе">
      {loading && <div className="text-center py-4 text-gray-400">⏳ Загрузка...</div>}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded border bg-white">
          <option value="">Все объекты</option>
          {ENTITY_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded border bg-white">
          <option value="">Все действия</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-xs text-gray-400 self-center">({filtered.length} из {logs.length})</span>
      </div>
      {filtered.length > 0 ? (
        <DataTable columns={[
          { key: 'timestamp', label: 'Время', render: (v: string) => v ? new Date(v).toLocaleString('ru-RU') : '—' },
          { key: 'user_name', label: 'Пользователь' },
          { key: 'action', label: 'Действие' },
          { key: 'entity_type', label: 'Объект' },
          { key: 'description', label: 'Описание' },
        ]} data={filtered} />
      ) : <EmptyState message="Нет записей аудита" />}
    </PageLayout>
  );
}
