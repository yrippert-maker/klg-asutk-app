'use client';
import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/ui';
import { apiFetch } from '@/lib/api/api-client';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    apiFetch('/users/me').then(setUser).catch(() => setUser({ name: 'Пользователь', email: '', roles: ['user'] }));
  }, []);

  if (!user) return <PageLayout title="👤 Профиль"><div className="text-center py-8 text-gray-400">⏳</div></PageLayout>;

  return (
    <PageLayout title="👤 Профиль" subtitle="Информация о пользователе">
      <div className="max-w-lg space-y-4">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
              {(user.name || user.full_name || '?')[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold">{user.name || user.full_name || 'Пользователь'}</div>
              <div className="text-sm text-gray-500">{user.email || ''}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Роль</span>
              <span className="font-medium">{(user.roles || ['user']).join(', ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-xs text-gray-400">{user.sub || user.id || '—'}</span>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-2">🔗 Быстрые ссылки</h3>
          <div className="space-y-1 text-sm">
            <a href="/settings" className="block text-blue-500 hover:underline">⚙️ Настройки уведомлений</a>
            <a href="/audit-history" className="block text-blue-500 hover:underline">📝 История действий</a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
