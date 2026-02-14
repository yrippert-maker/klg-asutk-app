'use client';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  user_name?: string;
  description?: string;
  created_at: string;
}

interface Props { activities: Activity[]; maxItems?: number; }

const actionIcons: Record<string, string> = {
  create: '➕', update: '✏️', delete: '🗑️', submit: '📤', approve: '✅',
  reject: '❌', scan: '🔍', export: '📊', login: '🔐', batch_delete: '🗑️',
};
const entityIcons: Record<string, string> = {
  aircraft: '✈️', organization: '🏢', cert_application: '📋', risk_alert: '⚠️',
  audit: '🔍', checklist: '✅', user: '👤', notification: '🔔',
};

export default function ActivityTimeline({ activities, maxItems = 20 }: Props) {
  const items = activities.slice(0, maxItems);

  if (!items.length) return <div className="text-center py-6 text-gray-400 text-sm">Нет активности</div>;

  return (
    <div className="space-y-0">
      {items.map((a, i) => (
        <div key={a.id} className="flex gap-3 relative">
          {/* Timeline line */}
          {i < items.length - 1 && <div className="absolute left-[15px] top-8 w-0.5 h-full bg-gray-200" />}
          {/* Icon */}
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm shrink-0 z-10">
            {actionIcons[a.action] || entityIcons[a.entity_type] || '📝'}
          </div>
          {/* Content */}
          <div className="flex-1 pb-4 min-w-0">
            <div className="flex justify-between items-start">
              <div className="text-sm">
                <span className="font-medium">{a.user_name || 'Система'}</span>
                <span className="text-gray-500"> · {a.action}</span>
                <span className="text-gray-400"> · {a.entity_type}</span>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                {new Date(a.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
              </span>
            </div>
            {a.description && <div className="text-xs text-gray-500 mt-0.5 truncate">{a.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
