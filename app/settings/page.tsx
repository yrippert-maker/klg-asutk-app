'use client';
import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/ui';
import { apiFetch } from '@/lib/api/api-client';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/notification-preferences').then(setPrefs);
  }, []);

  const save = async () => {
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

  if (!prefs) return <PageLayout title="⚙️ Настройки"><div className="text-center py-8 text-gray-400">⏳</div></PageLayout>;

  return (
    <PageLayout title="⚙️ Настройки" subtitle="Уведомления и персонализация">
      <div className="max-w-lg space-y-6">
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
      </div>
    </PageLayout>
  );
}
