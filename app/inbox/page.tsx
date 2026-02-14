'use client';
import { useState, useEffect } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState } from '@/components/ui';

export default function InboxPage() {
  const [messages, setMessages] = useState([] as any[]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true); fetch('/api/v1/inbox').then(r => r.json()).then(d => { setMessages(d.items || []); setLoading(false); }); }, []);
  return (
    <>
    {loading && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><div className="text-gray-500">⏳ Загрузка...</div></div>}
      <PageLayout title="📥 Входящие" subtitle="Уведомления и сообщения">
      {messages.length > 0 ? (
        <DataTable columns={[
          { key: 'subject', label: 'Тема' },
          { key: 'from', label: 'От' },
          { key: 'type', label: 'Тип', render: (v: string) => <StatusBadge status={v} colorMap={{ alert: 'bg-red-500', info: 'bg-blue-500', task: 'bg-yellow-500' }} /> },
          { key: 'read', label: 'Прочитано', render: (v: boolean) => v ? '✅' : '📩' },
          { key: 'created_at', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
        ]} data={messages} />
      ) : <EmptyState message="Нет сообщений" />}
    </PageLayout>
    </>
  );
}
