'use client';
import { PageLayout, DataTable, StatusBadge } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationCenter() {
  const { notifications, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Все уведомления ({notifications.length})</h3>
        <button onClick={markAllRead} className="btn-sm bg-primary-500 text-white">Прочитать все</button>
      </div>
      <DataTable data={notifications} emptyMessage="Нет уведомлений"
        columns={[
          { key: 'created_at', header: 'Время', render: (n: any) => <span className="text-xs">{n.created_at ? new Date(n.created_at).toLocaleString('ru-RU') : '—'}</span> },
          { key: 'message', header: 'Сообщение', render: (n: any) => <span className={n.is_read ? 'text-gray-400' : 'font-medium'}>{n.message || n.title}</span> },
          { key: 'notification_type', header: 'Тип', render: (n: any) => <StatusBadge status={n.notification_type || 'info'} /> },
          { key: 'actions', header: '', render: (n: any) => !n.is_read ? <button onClick={() => markRead(n.id)} className="btn-sm bg-blue-100 text-blue-600">✓</button> : <span className="text-xs text-green-500">✓</span> },
        ]}
        onRowClick={(n: any) => !n.is_read && markRead(n.id)} />
    </div>
  );
}
