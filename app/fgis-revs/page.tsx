/**
 * Интеграция ФГИС РЭВС — Федеральная ГИС реестра эксплуатантов ВС.
 * ВК РФ ст. 33, 36, 37.2; Приказ Росавиации № 180-П; ФАП-148.
 */
'use client';
import { useState, useCallback } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState } from '@/components/ui';

type Tab = 'aircraft' | 'certificates' | 'operators' | 'directives' | 'maint-orgs' | 'sync' | 'connection';

export default function FGISPage() {
  const [tab, setTab] = useState<Tab>('aircraft');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  const api = useCallback(async (ep: string, method = 'GET') => {
    setLoading(true);
    try {
      const opts: RequestInit = { method };
      const r = await fetch(`/api/v1/fgis-revs/${ep}`, opts);
      const d = await r.json();
      setData(d);
      return d;
    } finally { setLoading(false); }
  }, []);

  const loadTab = useCallback((t: Tab) => {
    setTab(t);
    setData(null);
    switch (t) {
      case 'aircraft': api('aircraft-registry'); break;
      case 'certificates': api('certificates'); break;
      case 'operators': api('operators'); break;
      case 'directives': api('directives'); break;
      case 'maint-orgs': api('maintenance-organizations'); break;
      case 'sync': api('sync/status'); break;
      case 'connection': api('connection-status'); break;
    }
  }, [api]);

  const runSync = async (type: string) => {
    setSyncing(true);
    try {
      const r = await fetch(`/api/v1/fgis-revs/sync/${type}`, { method: 'POST' });
      const d = await r.json();
      setSyncResults(d);
      if (type === 'all') loadTab('sync');
    } finally { setSyncing(false); }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'aircraft', label: 'Реестр ВС', icon: '✈️' },
    { id: 'certificates', label: 'СЛГ', icon: '📜' },
    { id: 'operators', label: 'Эксплуатанты', icon: '🏢' },
    { id: 'directives', label: 'Директивы ЛГ', icon: '⚠️' },
    { id: 'maint-orgs', label: 'Орг. по ТО', icon: '🔧' },
    { id: 'sync', label: 'Синхронизация', icon: '🔄' },
    { id: 'connection', label: 'Подключение', icon: '🔌' },
  ];

  return (
    <PageLayout title="🏛️ ФГИС РЭВС" subtitle="Федеральная ГИС реестра эксплуатантов ВС — ВК РФ ст. 33; Приказ Росавиации № 180-П">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => loadTab(t.id)}
            className={`px-3 py-1.5 rounded-t text-xs transition-colors ${tab === t.id
              ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-400">⏳ Загрузка данных из ФГИС РЭВС...</div>}

      {/* Aircraft Registry */}
      {tab === 'aircraft' && data && !loading && (
        <div>
          <div className="text-xs text-gray-400 mb-2">📡 Источник: {data.source} | {data.legal_basis} | {data.total} записей</div>
          <DataTable columns={[
            { key: 'registration', label: 'Рег. знак' },
            { key: 'aircraft_type', label: 'Тип ВС' },
            { key: 'serial_number', label: 'Серийный №' },
            { key: 'manufacturer', label: 'Изготовитель', render: (v: string) => <span className="text-xs">{(v||'').slice(0,30)}</span> },
            { key: 'year_manufactured', label: 'Год' },
            { key: 'operator', label: 'Эксплуатант' },
            { key: 'base_airport', label: 'Аэродром' },
            { key: 'status', label: 'Статус', render: (v: string) => (
              <StatusBadge status={v} colorMap={{ active: 'bg-green-500', stored: 'bg-yellow-500', deregistered: 'bg-red-500' }}
                labelMap={{ active: 'Действующий', stored: 'На хранении', deregistered: 'Снят с учёта' }} />
            )},
          ]} data={data.items || []} />
        </div>
      )}

      {/* Certificates */}
      {tab === 'certificates' && data && !loading && (
        <div>
          <div className="text-xs text-gray-400 mb-2">📡 {data.source} | {data.legal_basis}</div>
          <DataTable columns={[
            { key: 'certificate_number', label: '№ СЛГ' },
            { key: 'aircraft_registration', label: 'Борт' },
            { key: 'certificate_type', label: 'Тип', render: (v: string) => ({ standard: 'Стандартный', restricted: 'Ограниченный', special: 'Специальный', export: 'Экспортный' }[v] || v) },
            { key: 'category', label: 'Категория' },
            { key: 'issue_date', label: 'Выдан' },
            { key: 'expiry_date', label: 'Действует до' },
            { key: 'status', label: 'Статус', render: (v: string) => (
              <StatusBadge status={v} colorMap={{ valid: 'bg-green-500', expired: 'bg-red-500', suspended: 'bg-yellow-500', revoked: 'bg-gray-500' }}
                labelMap={{ valid: 'Действует', expired: 'Истёк', suspended: 'Приостановлен', revoked: 'Аннулирован' }} />
            )},
          ]} data={data.items || []} />
        </div>
      )}

      {/* Operators */}
      {tab === 'operators' && data && !loading && (
        <div>
          <div className="text-xs text-gray-400 mb-2">📡 {data.source} | {data.legal_basis}</div>
          {(data.items || []).map((op: any, i: number) => (
            <div key={i} className="card p-4 mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm">{op.name}</h3>
                  <div className="text-xs text-gray-500 mt-1">СЭ: {op.certificate_number} | ИНН: {op.inn} | ОГРН: {op.ogrn}</div>
                </div>
                <StatusBadge status={op.status} colorMap={{ active: 'bg-green-500', suspended: 'bg-yellow-500', revoked: 'bg-red-500' }}
                  labelMap={{ active: 'Действующий', suspended: 'Приостановлен', revoked: 'Аннулирован' }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(op.aircraft_types || []).map((t: string) => (
                  <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Парк: {op.fleet_count} ВС | Действует: {op.issue_date} — {op.expiry_date}</div>
            </div>
          ))}
        </div>
      )}

      {/* Directives */}
      {tab === 'directives' && data && !loading && (
        <div>
          <div className="text-xs text-gray-400 mb-2">📡 {data.source} | {data.legal_basis}</div>
          <DataTable columns={[
            { key: 'number', label: '№ ДЛГ' },
            { key: 'title', label: 'Наименование' },
            { key: 'aircraft_types', label: 'Типы ВС', render: (v: any) => (v || []).join(', ') },
            { key: 'ata_chapter', label: 'ATA' },
            { key: 'effective_date', label: 'С даты' },
            { key: 'compliance_type', label: 'Тип', render: (v: string) => (
              <StatusBadge status={v} colorMap={{ mandatory: 'bg-red-500', recommended: 'bg-blue-400', info: 'bg-gray-400' }} />
            )},
          ]} data={data.items || []} />
          <button onClick={() => runSync('directives')} disabled={syncing}
            className="mt-3 btn-primary px-4 py-2 rounded text-xs disabled:opacity-50">
            {syncing ? '⏳ Импорт...' : '📥 Импортировать ДЛГ в систему'}
          </button>
        </div>
      )}

      {/* Maintenance Organizations */}
      {tab === 'maint-orgs' && data && !loading && (
        <div>
          <div className="text-xs text-gray-400 mb-2">📡 {data.source} | {data.legal_basis}</div>
          {(data.items || []).map((org: any, i: number) => (
            <div key={i} className="card p-4 mb-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold text-sm">{org.name}</h3>
                  <div className="text-xs text-gray-500">Сертификат: {org.certificate_number}</div>
                </div>
                <StatusBadge status={org.status} colorMap={{ active: 'bg-green-500' }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(org.approval_scope || []).map((s: string) => (
                  <span key={s} className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-mono">{s}</span>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Действует: {org.issue_date} — {org.expiry_date}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sync */}
      {tab === 'sync' && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { type: 'aircraft', label: '✈️ Реестр ВС', desc: 'Двунаправленная синх.' },
              { type: 'certificates', label: '📜 СЛГ', desc: 'Pull из ФГИС' },
              { type: 'directives', label: '⚠️ Директивы ЛГ', desc: 'Pull + auto-create AD' },
              { type: 'all', label: '🔄 Полная синхр.', desc: 'Все реестры' },
            ].map(s => (
              <button key={s.type} onClick={() => runSync(s.type)} disabled={syncing}
                className="card p-4 text-left hover:shadow-md transition-shadow disabled:opacity-50">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-[10px] text-gray-400 mt-1">{s.desc}</div>
              </button>
            ))}
          </div>
          {syncing && <div className="text-center py-4 text-blue-500">🔄 Синхронизация...</div>}
          {syncResults && (
            <div className="card p-4 bg-green-50">
              <h3 className="text-sm font-bold text-green-700 mb-2">✅ Результат синхронизации</h3>
              <pre className="text-[10px] text-gray-600 overflow-x-auto">{JSON.stringify(syncResults, null, 2)}</pre>
            </div>
          )}
          {data?.history?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-2">📋 История синхронизаций</h3>
              <DataTable columns={[
                { key: 'entity_type', label: 'Реестр' },
                { key: 'direction', label: 'Направление' },
                { key: 'status', label: 'Статус', render: (v: string) => (
                  <StatusBadge status={v} colorMap={{ success: 'bg-green-500', partial: 'bg-yellow-500', failed: 'bg-red-500' }} />
                )},
                { key: 'records_synced', label: 'Синхр.' },
                { key: 'records_failed', label: 'Ошибки' },
                { key: 'started_at', label: 'Время', render: (v: string) => v ? new Date(v).toLocaleString('ru-RU') : '—' },
              ]} data={data.history} />
            </div>
          )}
        </div>
      )}

      {/* Connection Status */}
      {tab === 'connection' && data && !loading && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2">📡 ФГИС РЭВС (REST API)</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">URL:</span><span className="font-mono">{data.fgis_revs?.url}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Статус:</span>
                <StatusBadge status={data.fgis_revs?.status} colorMap={{ connected: 'bg-green-500', mock_mode: 'bg-yellow-500', error: 'bg-red-500' }}
                  labelMap={{ mock_mode: 'Тестовый режим', connected: 'Подключено', error: 'Ошибка' }} />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{data.fgis_revs?.note}</div>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2">🔐 СМЭВ 3.0 (SOAP)</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">URL:</span><span className="font-mono text-[10px]">{data.smev_30?.url}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Статус:</span>
                <StatusBadge status={data.smev_30?.status} colorMap={{ mock_mode: 'bg-yellow-500' }} labelMap={{ mock_mode: 'Тестовый режим' }} />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{data.smev_30?.note}</div>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2">⚙️ Конфигурация</h3>
            <div className="space-y-1 text-xs">
              {Object.entries(data.config || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}:</span><span className="font-mono">{String(v)}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!data && !loading && tab !== 'sync' && <EmptyState message="Выберите раздел для загрузки данных" />}
    </PageLayout>
  );
}
