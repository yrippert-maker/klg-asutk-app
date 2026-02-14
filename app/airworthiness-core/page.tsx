/**
 * Ядро системы ПЛГ — Контроль лётной годности
 * 5 подсистем: ДЛГ (AD), Бюллетени (SB), Ресурсы, Программы ТО, Компоненты
 * 
 * ВК РФ ст. 36, 37, 37.2; ФАП-148; ФАП-145; EASA Part-M; ICAO Annex 6/8
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageLayout, DataTable, StatusBadge, Modal, EmptyState } from '@/components/ui';

type Tab = 'directives' | 'bulletins' | 'life-limits' | 'maint-programs' | 'components';

const TABS: { id: Tab; label: string; icon: string; basis: string }[] = [
  { id: 'directives', label: 'ДЛГ / AD', icon: '⚠️', basis: 'ВК РФ ст. 37; ФАП-148 п.4.3' },
  { id: 'bulletins', label: 'Бюллетени SB', icon: '📢', basis: 'ФАП-148 п.4.5; EASA Part-21' },
  { id: 'life-limits', label: 'Ресурсы', icon: '⏱️', basis: 'ФАП-148 п.4.2; EASA Part-M.A.302' },
  { id: 'maint-programs', label: 'Программы ТО', icon: '📋', basis: 'ФАП-148 п.3; ICAO Annex 6' },
  { id: 'components', label: 'Компоненты', icon: '🔩', basis: 'ФАП-145 п.A.42; EASA Part-M.A.501' },
];

export default function AirworthinessCorePage() {
  const [tab, setTab] = useState<Tab>('directives');
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const api = useCallback(async (endpoint: string, opts?: RequestInit) => {
    const res = await fetch(`/api/v1/airworthiness-core/${endpoint}`, opts);
    return res.json();
  }, []);

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'life-limits' ? 'life-limits' : tab === 'maint-programs' ? 'maintenance-programs' : tab;
    api(endpoint).then(d => { setData(prev => ({ ...prev, [tab]: d })); setLoading(false); });
  }, [tab, api]);

  const currentTab = TABS.find(t => t.id === tab)!;
  const items = data[tab]?.items || [];

  const statusColors: Record<string, string> = {
    open: 'bg-red-500', complied: 'bg-green-500', incorporated: 'bg-green-500',
    not_applicable: 'bg-gray-400', deferred: 'bg-yellow-500',
    serviceable: 'bg-green-500', unserviceable: 'bg-red-500', overhauled: 'bg-blue-500', scrapped: 'bg-gray-400',
    mandatory: 'bg-red-500', alert: 'bg-orange-500', recommended: 'bg-blue-500', info: 'bg-gray-400',
  };
  const statusLabels: Record<string, string> = {
    open: 'Открыта', complied: 'Выполнена', incorporated: 'Внедрён',
    not_applicable: 'Неприменимо', deferred: 'Отложена',
    serviceable: 'Исправен', unserviceable: 'Неисправен', overhauled: 'После ремонта', scrapped: 'Списан',
    mandatory: 'Обязат.', alert: 'Важный', recommended: 'Рекоменд.', info: 'Информ.',
  };

  return (
    <PageLayout title="🔧 Контроль лётной годности"
      subtitle="Директивы, бюллетени, ресурсы, программы ТО, компоненты"
      actions={<button onClick={() => setShowAddModal(true)} className="btn-primary text-sm px-4 py-2 rounded">+ Добавить</button>}>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
        <strong>Ядро системы ПЛГ.</strong> ВК РФ ст. 36, 37, 37.2; ФАП-148; ФАП-145; EASA Part-M; ICAO Annex 6/8.
        Модуль обеспечивает непрерывный контроль лётной годности ВС.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">⏳ Загрузка...</div> : (
        <>
          {/* DIRECTIVES (AD/ДЛГ) */}
          {tab === 'directives' && (
            items.length > 0 ? (
              <DataTable columns={[
                { key: 'number', label: '№ ДЛГ' },
                { key: 'title', label: 'Наименование' },
                { key: 'issuing_authority', label: 'Орган' },
                { key: 'aircraft_types', label: 'Типы ВС', render: (v: string[]) => v?.join(', ') || '—' },
                { key: 'compliance_type', label: 'Тип', render: (v: string) => <StatusBadge status={v} colorMap={statusColors} labelMap={statusLabels} /> },
                { key: 'effective_date', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
                { key: 'status', label: 'Статус', render: (v: string) => <StatusBadge status={v} colorMap={statusColors} labelMap={statusLabels} /> },
              ]} data={items} />
            ) : <EmptyState message="Нет зарегистрированных директив ЛГ" />
          )}

          {/* BULLETINS (SB) */}
          {tab === 'bulletins' && (
            items.length > 0 ? (
              <DataTable columns={[
                { key: 'number', label: '№ SB' },
                { key: 'title', label: 'Наименование' },
                { key: 'manufacturer', label: 'Изготовитель' },
                { key: 'category', label: 'Категория', render: (v: string) => <StatusBadge status={v} colorMap={statusColors} labelMap={statusLabels} /> },
                { key: 'estimated_manhours', label: 'Трудоёмк. (ч)', render: (v: number) => v || '—' },
                { key: 'status', label: 'Статус', render: (v: string) => <StatusBadge status={v} colorMap={statusColors} labelMap={statusLabels} /> },
              ]} data={items} />
            ) : <EmptyState message="Нет зарегистрированных бюллетеней" />
          )}

          {/* LIFE LIMITS */}
          {tab === 'life-limits' && (
            items.length > 0 ? (
              <DataTable columns={[
                { key: 'component_name', label: 'Компонент' },
                { key: 'part_number', label: 'P/N' },
                { key: 'serial_number', label: 'S/N' },
                { key: 'current_hours', label: 'Наработка (ч)' },
                { key: 'current_cycles', label: 'Циклы' },
                { key: 'remaining', label: 'Остаток', render: (v: any) => {
                  if (!v) return '—';
                  const parts = [];
                  if (v.hours !== undefined) parts.push(`${v.hours}ч`);
                  if (v.cycles !== undefined) parts.push(`${v.cycles}цикл`);
                  if (v.days !== undefined) parts.push(`${v.days}дн`);
                  const isLow = Object.values(v).some((val: any) => typeof val === 'number' && val < 100);
                  return <span className={isLow ? 'text-red-600 font-bold' : 'text-green-600'}>{parts.join(' / ') || '—'}</span>;
                }},
                { key: 'critical', label: '⚠️', render: (v: boolean) => v ? <span className="text-red-600 font-bold">КРИТИЧ.</span> : '✅' },
              ]} data={items} />
            ) : <EmptyState message="Нет записей о ресурсах компонентов" />
          )}

          {/* MAINTENANCE PROGRAMS */}
          {tab === 'maint-programs' && (
            items.length > 0 ? (
              <div className="space-y-3">
                {items.map((m: any) => (
                  <div key={m.id} className="card p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium text-sm">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.aircraft_type} · {m.revision}</div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        {m.approved_by && <div>Утв.: {m.approved_by}</div>}
                        <div>{m.tasks?.length || 0} задач</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="Нет программ ТО" />
          )}

          {/* COMPONENTS */}
          {tab === 'components' && (
            items.length > 0 ? (
              <DataTable columns={[
                { key: 'name', label: 'Наименование' },
                { key: 'part_number', label: 'P/N' },
                { key: 'serial_number', label: 'S/N' },
                { key: 'ata_chapter', label: 'ATA' },
                { key: 'current_hours', label: 'Наработка (ч)' },
                { key: 'condition', label: 'Состояние', render: (v: string) => <StatusBadge status={v} colorMap={statusColors} labelMap={statusLabels} /> },
                { key: 'certificate_type', label: 'Сертификат' },
              ]} data={items} />
            ) : <EmptyState message="Нет зарегистрированных компонентов" />
          )}
        </>
      )}

      {/* Legal basis footer */}
      <div className="mt-6 text-[10px] text-gray-400">
        {currentTab.basis} · © АО «REFLY»
      </div>
    </PageLayout>
  );
}
