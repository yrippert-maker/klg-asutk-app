'use client';
import { useState, useEffect, useMemo } from 'react';
import { PageLayout, StatusBadge } from '@/components/ui';
import ActivityTimeline from '@/components/ActivityTimeline';

interface AuditEntry { id: string; action: string; entity_type: string; user_name?: string; description?: string; created_at: string; }
interface Stats { total: number; byAction: Record<string, number>; byEntity: Record<string, number>; byDay: Record<string, number>; }

export default function AnalyticsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/audit-log?page=1&per_page=500`)
      .then(r => r.json()).then(d => setEntries(d.items || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = useMemo<Stats>(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const filtered = entries.filter(e => new Date(e.created_at) >= cutoff);
    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    for (const e of filtered) {
      byAction[e.action] = (byAction[e.action] || 0) + 1;
      byEntity[e.entity_type] = (byEntity[e.entity_type] || 0) + 1;
      const day = new Date(e.created_at).toLocaleDateString('ru-RU');
      byDay[day] = (byDay[day] || 0) + 1;
    }
    return { total: filtered.length, byAction, byEntity, byDay };
  }, [entries, days]);

  const topActions = Object.entries(stats.byAction).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topEntities = Object.entries(stats.byEntity).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxAction = Math.max(...topActions.map(([, v]) => v), 1);

  return (
    <PageLayout title="📊 Аналитика активности" subtitle={loading ? 'Загрузка...' : `${stats.total} действий за ${days} дн.`}
      actions={
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded text-sm ${days === d ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {d}д
            </button>
          ))}
        </div>
      }>
      {loading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 text-center"><div className="text-3xl font-bold text-primary-500">{stats.total}</div><div className="text-xs text-gray-500">Всего действий</div></div>
            <div className="card p-4 text-center"><div className="text-3xl font-bold text-green-500">{stats.byAction['create'] || 0}</div><div className="text-xs text-gray-500">Создано</div></div>
            <div className="card p-4 text-center"><div className="text-3xl font-bold text-blue-500">{stats.byAction['update'] || 0}</div><div className="text-xs text-gray-500">Обновлено</div></div>
            <div className="card p-4 text-center"><div className="text-3xl font-bold text-red-500">{stats.byAction['delete'] || 0}</div><div className="text-xs text-gray-500">Удалено</div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top actions bar chart */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-gray-600 mb-3">По типу действия</h3>
              <div className="space-y-2">
                {topActions.map(([action, count]) => (
                  <div key={action} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 truncate">{action}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="bg-primary-500 h-full rounded-full transition-all" style={{ width: `${(count / maxAction) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top entities */}
            <div className="card p-4">
              <h3 className="text-sm font-bold text-gray-600 mb-3">По объектам</h3>
              <div className="space-y-2">
                {topEntities.map(([entity, count]) => (
                  <div key={entity} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                    <span className="text-sm">{entity}</span>
                    <span className="badge bg-gray-100 text-gray-700">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-600 mb-3">Последняя активность</h3>
            <ActivityTimeline activities={entries.slice(0, 15)} maxItems={15} />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
