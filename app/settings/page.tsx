'use client';
import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/ui';
import { apiFetch } from '@/lib/api/api-client';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABELS: Record<string, string> = { admin: 'Администратор', authority_inspector: 'Инспектор', operator_manager: 'Менеджер оператора', operator_user: 'Оператор', mro_manager: 'Менеджер ТОиР', mro_specialist: 'Специалист ТОиР', mro_user: 'Специалист ТОиР' };

const DEFAULT_ORG = { name: 'АО «Авиакомпания»', inn: '7707123456', address: 'г. Москва, ул. Авиационная, 1' };
const DEFAULT_TEMPLATES = { work_order: 'Шаблон наряда ТО', defect: 'Шаблон дефекта', certificate: 'Шаблон сертификата' };
const DEFAULT_REFBOOKS = { aircraft_types: 'Типы ВС', ata_chapters: 'ATA главы', positions: 'Должности' };

export default function SettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [orgProfile, setOrgProfile] = useState(DEFAULT_ORG);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [refbooks, setRefbooks] = useState(DEFAULT_REFBOOKS);
  const [integrations, setIntegrations] = useState<Record<string, string>>({ ai: 'warning', fgis: 'off', keycloak: 'on', minio: 'on' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch('/notification-preferences').catch(() => null).then(setPrefs);
  }, []);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    await apiFetch('/notification-preferences', { method: 'PUT', body: JSON.stringify(prefs) });
    setSaving(false);
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify({ prefs, orgProfile, templates, refbooks, integrations }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'settings_export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const j = JSON.parse(r.result as string); if (j.orgProfile) setOrgProfile(j.orgProfile); if (j.templates) setTemplates(j.templates); if (j.refbooks) setRefbooks(j.refbooks); if (j.integrations) setIntegrations(j.integrations); if (j.prefs) setPrefs(j.prefs); } catch { alert('Ошибка формата файла'); } };
    r.readAsText(f);
    e.target.value = '';
  };

  const resetSection = (section: string) => {
    if (!confirm(`Сбросить настройки раздела «${section}»?`)) return;
    if (section === 'Профиль организации') setOrgProfile(DEFAULT_ORG);
    if (section === 'Шаблоны') setTemplates(DEFAULT_TEMPLATES);
    if (section === 'Справочники') setRefbooks(DEFAULT_REFBOOKS);
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
    <PageLayout title="⚙️ Настройки" subtitle="Профиль, система, уведомления"
      actions={<div className="flex gap-2"><button onClick={exportSettings} className="btn-sm bg-gray-100 text-gray-700">Экспорт настроек</button><button onClick={() => fileInputRef.current?.click()} className="btn-sm bg-gray-100 text-gray-700">Импорт настроек</button><input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importSettings} /></div>}>
      <div className="max-w-2xl space-y-6">
        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🏢 Профиль организации</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center"><span className="text-gray-500">Название</span><input className="input-field w-48 text-right" value={orgProfile.name} onChange={e => setOrgProfile(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="flex justify-between items-center"><span className="text-gray-500">ИНН</span><input className="input-field w-48 text-right" value={orgProfile.inn} onChange={e => setOrgProfile(p => ({ ...p, inn: e.target.value }))} /></div>
            <div className="flex justify-between items-center"><span className="text-gray-500">Адрес</span><input className="input-field flex-1 ml-2" value={orgProfile.address} onChange={e => setOrgProfile(p => ({ ...p, address: e.target.value }))} /></div>
          </div>
          <button onClick={() => resetSection('Профиль организации')} className="mt-2 text-xs text-red-600 hover:underline">Сбросить раздел</button>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">👤 Профиль пользователя</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Имя</span><span className="font-medium">{user?.display_name ?? 'Dev User'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{user?.email ?? 'dev@local'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Роль</span><span>{user?.role ? ROLE_LABELS[user.role] ?? user.role : 'Администратор'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Организация</span><span>{user?.organization_name ?? orgProfile.name}</span></div>
          </div>
        </section>

        {prefs && (
          <section className="card p-4">
            <h3 className="text-sm font-bold text-gray-600 mb-3">📢 Уведомления</h3>
            <Toggle label="⚠️ Обязательные ДЛГ" field="ad_mandatory" />
            <Toggle label="📋 Рекомендательные ДЛГ" field="ad_recommended" />
            <Toggle label="🔴 Критические дефекты" field="defect_critical" />
            <Toggle label="🟡 Значительные дефекты" field="defect_major" />
            <Toggle label="🟢 Незначительные дефекты" field="defect_minor" />
            <Toggle label="🔴 AOG наряды" field="wo_aog" />
            <Toggle label="✅ Закрытие нарядов (CRS)" field="wo_closed" />
            <Toggle label="📧 Email" field="channels_email" />
            <Toggle label="🔔 Push" field="channels_push" />
          </section>
        )}

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🔗 Интеграции</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center"><span>AI-помощник</span><span className={integrations.ai === 'on' ? 'text-green-600' : 'text-amber-600'}>{integrations.ai === 'on' ? 'Подключено' : '⚠️ Настройка'}</span></div>
            <div className="flex justify-between items-center"><span>ФГИС ЕС ОрВД</span><span className="text-gray-500">Не подключено</span></div>
            <div className="flex justify-between items-center"><span>Keycloak SSO</span><span className="text-green-600">Подключено</span></div>
            <div className="flex justify-between items-center"><span>MinIO (документы)</span><span className="text-green-600">Подключено</span></div>
          </div>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">📄 Шаблоны документов</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(templates).map(([k, v]) => <div key={k} className="flex justify-between items-center"><span className="text-gray-500">{k}</span><input className="input-field w-56" value={v} onChange={e => setTemplates(p => ({ ...p, [k]: e.target.value }))} /></div>)}
          </div>
          <button onClick={() => resetSection('Шаблоны')} className="mt-2 text-xs text-red-600 hover:underline">Сбросить раздел</button>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">📖 Справочники</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(refbooks).map(([k, v]) => <div key={k} className="flex justify-between items-center"><span className="text-gray-500">{k}</span><input className="input-field w-48" value={v} onChange={e => setRefbooks(p => ({ ...p, [k]: e.target.value }))} /></div>)}
          </div>
          <button onClick={() => resetSection('Справочники')} className="mt-2 text-xs text-red-600 hover:underline">Сбросить раздел</button>
        </section>

        <section className="card p-4">
          <h3 className="text-sm font-bold text-gray-600 mb-3">🖥️ Система</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Название</span><span>REFLY АСУ ТК</span></div>
            <div className="flex justify-between"><span>Версия</span><span>2.0.0-beta</span></div>
            <div className="flex justify-between"><span>Часовой пояс</span><span>Europe/Moscow (UTC+3)</span></div>
          </div>
        </section>

        {prefs && (
          <button onClick={save} disabled={saving} className="btn-primary px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? '⏳ Сохранение...' : '💾 Сохранить настройки'}
          </button>
        )}
        <p className="text-xs text-gray-400">© 2025–2026 REFLY Aviation Technologies</p>
      </div>
    </PageLayout>
  );
}
