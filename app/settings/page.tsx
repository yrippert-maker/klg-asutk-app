'use client';
import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/ui';
import { apiFetch } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', authority_inspector: 'Инспектор', operator_manager: 'Менеджер оператора', operator_user: 'Оператор', mro_manager: 'Менеджер ТОиР', mro_specialist: 'Специалист ТОиР', mro_user: 'Специалист ТОиР' };

export default function SettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/notification-preferences').catch(() => null).then(setPrefs);
  }, []);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    await apiFetch('/notification-preferences', { method: 'PUT', body: JSON.stringify(prefs) });
    setSaving(false);
  };

  const Toggle = ({ label, field }: { label: string; field: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm">{label}</span>
      <button onClick={() => setPrefs((p: any) => ({ ...p, [field]: !p[field] }))}
        className={`w-10 h-5 rounded-full transition-colors ${prefs?.[field] ? 'bg-blue-500' : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs?.[field] ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  return (
    <PageLayout title="⚙️ Настройки" subtitle="Профиль, система, уведомления">
      <div className="max-w-lg space-y-6">
        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">👤 Профиль пользователя</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Имя</span><span className="font-medium">{user?.display_name ?? 'Dev User'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{user?.email ?? 'dev@local'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Роль</span><span>{user?.role ? ROLE_LABELS[user.role] ?? user.role : 'Администратор'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Организация</span><span>{user?.organization_name ?? '—'}</span></div>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🖥️ Настройки системы</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Название системы</span><span>REFLY АСУ ТК</span></div>
            <div className="flex justify-between"><span>Версия</span><span>2.0.0-beta</span></div>
            <div className="flex justify-between"><span>Нормативная база</span><span>Part-M RU</span></div>
            <div className="flex justify-between"><span>Язык</span><span>Русский</span></div>
            <div className="flex justify-between"><span>Часовой пояс</span><span>Europe/Moscow (UTC+3)</span></div>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🔗 Интеграции</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center"><span>AI-помощник (Claude)</span><span className="text-amber-600">⚠️ Настройка</span></div>
            <div className="flex justify-between items-center"><span>ФГИС ЕС ОрВД</span><span className="text-gray-500">Не подключено</span></div>
            <div className="flex justify-between items-center"><span>Keycloak SSO</span><span className="text-green-600">Подключено (dev)</span></div>
            <div className="flex justify-between items-center"><span>MinIO (документы)</span><span className="text-green-600">Подключено</span></div>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">ℹ️ О системе</h3>
          <p className="text-sm text-gray-600">REFLY АСУ ТК v2.0.0-beta</p>
          <p className="text-xs text-gray-500 mt-1">Part-M RU · Гармонизировано с ICAO/EASA</p>
          <p className="text-xs text-gray-400 mt-2">© 2025–2026 REFLY Aviation Technologies</p>
        </section>

        {prefs && (
        <>
        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">📢 Типы уведомлений</h3>
          <Toggle label="⚠️ Обязательные ДЛГ (mandatory AD)" field="ad_mandatory" />
          <Toggle label="📋 Рекомендательные ДЛГ" field="ad_recommended" />
          <Toggle label="🔴 Критические дефекты" field="defect_critical" />
          <Toggle label="🟡 Значительные дефекты" field="defect_major" />
          <Toggle label="🟢 Незначительные дефекты" field="defect_minor" />
          <Toggle label="🔴 AOG наряды" field="wo_aog" />
          <Toggle label="✅ Закрытие нарядов (CRS)" field="wo_closed" />
          <Toggle label="⏱️ Критические ресурсы" field="life_limit_critical" />
          <Toggle label="🎓 Просрочка квалификации" field="personnel_expiry" />
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">📡 Каналы доставки</h3>
          <Toggle label="📧 Email" field="channels_email" />
          <Toggle label="🔔 Push-уведомления" field="channels_push" />
          <Toggle label="⚡ WebSocket (real-time)" field="channels_ws" />
        </section>


        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🎨 Оформление</h3>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm">🌙 Тёмная тема</span>
            <button id="dark-mode"
              onClick={() => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
              }}
              className="w-10 h-5 rounded-full bg-gray-300 dark:bg-blue-500 transition-colors">
              <div className="w-4 h-4 bg-white rounded-full shadow transition-transform dark:translate-x-5 translate-x-0.5" />
            </button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <span className="text-sm">📏 Компактный режим</span>
            <button className="w-10 h-5 rounded-full bg-gray-300 transition-colors">
              <div className="w-4 h-4 bg-white rounded-full shadow translate-x-0.5" />
            </button>
          </div>
        </section>

        <button onClick={save} disabled={saving}
          className="btn-primary px-6 py-2 rounded text-sm disabled:opacity-50">
          {saving ? '⏳ Сохранение...' : '💾 Сохранить настройки'}
        </button>
        </>
        )}
      </div>
    </PageLayout>
  );
}
