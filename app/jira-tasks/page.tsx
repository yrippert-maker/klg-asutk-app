/**
 * Jira Tasks page — loads from /api/jira-tasks.
 * Разработчик: АО «REFLY»
 */
'use client';

import { useState, useEffect } from 'react';
import { PageLayout, FilterBar, StatusBadge, EmptyState } from '@/components/ui';

interface JiraTask { issueId: string; summary: string; description?: string; priority: string; status?: string; components?: string[]; labels?: string[]; stories?: JiraTask[]; createdAt?: string; }

export default function JiraTasksPage() {
  const [epics, setEpics] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/jira-tasks');
        const data = await r.json();
        setEpics(data.epics || data || []);
      } catch { setEpics([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = priorityFilter ? epics.filter(e => e.priority === priorityFilter) : epics;
  const priorities = [...new Set(epics.map(e => e.priority).filter(Boolean))];

  return (
    <PageLayout title="Задачи Jira" subtitle={loading ? 'Загрузка...' : `Эпиков: ${filtered.length}`}>
      <FilterBar value={priorityFilter} onChange={setPriorityFilter} className="mb-4"
        options={[{ value: undefined, label: 'Все' }, ...priorities.map(p => ({ value: p, label: p }))]} />

      {loading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(epic => (
            <div key={epic.issueId} className="card">
              <div className="p-5 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(expanded === epic.issueId ? null : epic.issueId)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-primary-500">{epic.issueId}</span>
                    <StatusBadge status={epic.priority} colorMap={{ Highest: 'bg-red-600', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-500', Lowest: 'bg-gray-400' }} />
                  </div>
                  <div className="font-bold truncate">{epic.summary}</div>
                  {epic.components && epic.components.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {epic.components.map(c => <span key={c} className="badge bg-blue-100 text-blue-700 text-[10px]">{c}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {epic.stories && <span className="text-xs text-gray-500">{epic.stories.length} задач</span>}
                  <span className="text-lg">{expanded === epic.issueId ? '▼' : '▶'}</span>
                </div>
              </div>

              {expanded === epic.issueId && (
                <div className="border-t border-gray-100 px-5 pb-4">
                  {epic.description && <div className="text-sm text-gray-600 py-3 border-b border-gray-50">{epic.description}</div>}
                  {epic.stories && epic.stories.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {epic.stories.map(story => (
                        <div key={story.issueId} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                          <span className="font-mono text-xs text-gray-400 mt-0.5 min-w-[80px]">{story.issueId}</span>
                          <div className="flex-1">
                            <div className="text-sm">{story.summary}</div>
                            {story.labels && story.labels.length > 0 && (
                              <div className="flex gap-1 mt-1">{story.labels.map(l => <span key={l} className="badge bg-gray-100 text-gray-600 text-[10px]">{l}</span>)}</div>
                            )}
                          </div>
                          <StatusBadge status={story.priority} colorMap={{ Highest: 'bg-red-600', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' }} />
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-sm text-gray-400 py-3">Нет подзадач</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <EmptyState message="Нет задач. Импортируйте CSV из Jira." />}
    </PageLayout>
  );
}
