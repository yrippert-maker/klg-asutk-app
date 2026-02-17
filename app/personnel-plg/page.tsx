/**
 * Сертификация персонала ПЛГ
 * Учёт специалистов, первичная аттестация, повышение квалификации.
 * 
 * Правовые основания:
 *   ВК РФ ст. 52-54; ФАП-147; ФАП-145; ФАП-148
 *   EASA Part-66, Part-145.A.30/35, Part-CAMO.A.305
 *   ICAO Annex 1, Doc 9760 ch.6
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageLayout, DataTable, StatusBadge, Modal, EmptyState } from '@/components/ui';

type Tab = 'specialists' | 'programs' | 'attestations' | 'compliance';

interface Specialist { id: string; full_name: string; personnel_number: string; position: string; category: string; specializations: string[]; license_number?: string; license_expires?: string; status: string; compliance?: any; attestations?: any[]; qualifications?: any[]; }
interface Program { id: string; name: string; type: string; legal_basis?: string; duration_hours: number; modules?: any[]; periodicity?: string; certificate_validity_years?: number; status?: string; last_passed_date?: string; }
interface ProgramCompletion { id: string; full_name: string; position: string; program_name: string; status: string; date: string; valid_until: string; }

const DEMO_PROGRAMS: Program[] = [
  { id: 'PLG-INIT-001', name: 'Первичная подготовка специалиста по ПЛГ', type: 'initial', duration_hours: 240, certificate_validity_years: 0, status: 'активна', last_passed_date: '2024-09-15' },
  { id: 'PLG-REC-001', name: 'Периодическое повышение квалификации (recurrent)', type: 'recurrent', duration_hours: 40, periodicity: 'Каждые 24 месяца', certificate_validity_years: 2, status: 'активна', last_passed_date: '2024-11-01' },
  { id: 'PLG-TYPE-001', name: 'Подготовка на тип ВС SSJ-100', type: 'type_rating', duration_hours: 80, status: 'активна', last_passed_date: '2024-06-20' },
  { id: 'PLG-EWIS-001', name: 'EWIS — Электропроводка и соединители', type: 'ewis', duration_hours: 16, status: 'активна', last_passed_date: '2024-08-10' },
  { id: 'PLG-SMS-001', name: 'SMS — Система управления безопасностью', type: 'sms', duration_hours: 8, status: 'активна', last_passed_date: '2024-10-05' },
  { id: 'PLG-HF-001', name: 'Человеческий фактор', type: 'human_factors', duration_hours: 8, status: 'активна', last_passed_date: '2024-07-12' },
  { id: 'PLG-NDT-001', name: 'НК/NDT — Неразрушающий контроль', type: 'ndt', duration_hours: 24, status: 'активна', last_passed_date: '2024-05-22' },
];

const DEMO_PROGRAM_COMPLETIONS: ProgramCompletion[] = [
  { id: '1', full_name: 'Иванов Иван Иванович', position: 'Авиатехник B1', program_name: 'Первичная подготовка специалиста по ПЛГ', status: 'Пройдена', date: '2022-09-15', valid_until: '—' },
  { id: '2', full_name: 'Петров Пётр Петрович', position: 'Авиатехник B2', program_name: 'Периодическое повышение квалификации', status: 'Пройдена', date: '2024-11-01', valid_until: '2026-11-01' },
  { id: '3', full_name: 'Сидорова Анна Сергеевна', position: 'Инженер по ТО', program_name: 'Подготовка на тип ВС SSJ-100', status: 'Пройдена', date: '2024-06-20', valid_until: '—' },
  { id: '4', full_name: 'Козлов Михаил Андреевич', position: 'Специалист по НК', program_name: 'НК/NDT — Неразрушающий контроль', status: 'Пройдена', date: '2024-05-22', valid_until: '2026-05-22' },
  { id: '5', full_name: 'Новикова Елена Викторовна', position: 'Авиатехник B1', program_name: 'EWIS — Электропроводка', status: 'В процессе', date: '2024-12-01', valid_until: '—' },
  { id: '6', full_name: 'Иванов Иван Иванович', position: 'Авиатехник B1', program_name: 'Периодическое повышение квалификации', status: 'Пройдена', date: '2024-03-10', valid_until: '2026-03-10' },
  { id: '7', full_name: 'Петров Пётр Петрович', position: 'Авиатехник B2', program_name: 'SMS — Система управления безопасностью', status: 'Пройдена', date: '2024-10-05', valid_until: '2026-10-05' },
];

export default function PersonnelPLGPage() {
  const [tab, setTab] = useState<Tab>('specialists');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [compliance, setCompliance] = useState<any>(null);
  const [selected, setSelected] = useState<Specialist | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [editingCompletion, setEditingCompletion] = useState<ProgramCompletion | null>(null);
  const [programCompletions, setProgramCompletions] = useState<ProgramCompletion[]>(DEMO_PROGRAM_COMPLETIONS);
  const [loading, setLoading] = useState(false);

  const api = useCallback(async (endpoint: string, opts?: RequestInit) => {
    const res = await fetch(`/api/v1/personnel-plg/${endpoint}`, opts);
    return res.json();
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api('specialists').then(d => setSpecialists(d.items || [])),
      api('programs').then(d => setPrograms(Array.isArray(d?.programs) && d.programs.length > 0 ? d.programs : DEMO_PROGRAMS)),
      api('compliance-report').then(d => setCompliance(d)),
    ]).finally(() => setLoading(false));
  }, [api]);

  const exportProgramCompletions = () => {
    const headers = ['ФИО', 'Должность', 'Программа', 'Статус прохождения', 'Дата', 'Срок действия'];
    const rows = programCompletions.map(c => [c.full_name, c.position, c.program_name, c.status, c.date, c.valid_until]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'program_completions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSpecialist = async (data: any) => {
    const result = await api('specialists', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (result.id) { setSpecialists(prev => [...prev, result]); setShowAddModal(false); }
  };

  const tabs = [
    { id: 'specialists' as Tab, label: '👤 Специалисты', icon: '👤' },
    { id: 'programs' as Tab, label: '📚 Программы подготовки', icon: '📚' },
    { id: 'attestations' as Tab, label: '📝 Аттестация / ПК', icon: '📝' },
    { id: 'compliance' as Tab, label: '✅ Соответствие', icon: '✅' },
  ];

  const programTypeLabels: Record<string, string> = {
    initial: '🎓 Первичная', recurrent: '🔄 Периодическая', type_rating: '✈️ На тип ВС',
    ewis: '⚡ EWIS', fuel_tank: '⛽ FTS', ndt: '🔬 НК/NDT', human_factors: '🧠 ЧФ',
    sms: '🛡️ SMS', crs_authorization: '✍️ CRS', rvsm: '📏 RVSM', etops: '🌊 ETOPS',
  };

  return (
    <PageLayout title="🎓 Сертификация персонала ПЛГ"
      subtitle="Учёт специалистов, аттестация, повышение квалификации"
      actions={
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm px-4 py-2 rounded">
          + Добавить специалиста
        </button>
      }>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
        <strong>Правовая база:</strong> ВК РФ ст. 52-54; ФАП-147; ФАП-145 п.145.A.30/35; ФАП-148;
        EASA Part-66; Part-CAMO.A.305; ICAO Annex 1; Doc 9760 ch.6
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">⏳ Загрузка...</div> : (
        <>
          {/* SPECIALISTS */}
          {tab === 'specialists' && (
            specialists.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'personnel_number', label: 'Таб. №' },
                  { key: 'full_name', label: 'ФИО' },
                  { key: 'position', label: 'Должность' },
                  { key: 'category', label: 'Категория', render: (v: string) => <span className="badge bg-blue-100 text-blue-700">{v}</span> },
                  { key: 'specializations', label: 'Типы ВС', render: (v: string[]) => v?.join(', ') || '—' },
                  { key: 'license_number', label: 'Свидетельство' },
                  { key: 'status', label: 'Статус', render: (v: string) => (
                    <StatusBadge status={v} colorMap={{ active: 'bg-green-500', suspended: 'bg-red-500', expired: 'bg-yellow-500' }}
                      labelMap={{ active: 'Действует', suspended: 'Приостановлен', expired: 'Истёк' }} />
                  )},
                ]}
                data={specialists}
                onRowClick={(row) => {
                  api(`specialists/${row.id}`).then(setSelected);
                }}
              />
            ) : <EmptyState message="Нет специалистов. Добавьте первого специалиста ПЛГ." />
          )}

          {/* PROGRAMS */}
          {tab === 'programs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <button onClick={() => setShowAddProgramModal(true)} className="btn-primary text-sm px-4 py-2 rounded">+ Добавить программу</button>
                <button onClick={exportProgramCompletions} className="btn-sm bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm">Экспорт</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {programs.map(p => (
                  <div key={p.id} onClick={() => setSelectedProgram(p)}
                    className="card p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{programTypeLabels[p.type]?.split(' ')[0] || '📋'}</span>
                          <span className="font-medium text-sm">{p.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{p.legal_basis || `${p.duration_hours} ч.`}</div>
                        {p.last_passed_date && <div className="text-[10px] text-gray-400 mt-1">Последнее прохождение: {new Date(p.last_passed_date).toLocaleDateString('ru-RU')}</div>}
                      </div>
                      <div className="text-right shrink-0 flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setSelectedProgram(p); }} className="btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded" title="Редактировать">✏️</button>
                        <div className="badge bg-primary-100 text-primary-700">{p.duration_hours} ч.</div>
                        {p.periodicity && <div className="text-[10px] text-gray-400 mt-1">{p.periodicity}</div>}
                        {p.certificate_validity_years ? <div className="text-[10px] text-gray-400">Срок: {p.certificate_validity_years} лет</div> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-bold text-gray-700 mt-4">Прохождение программ</h3>
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50">
                    <th className="table-header">ФИО</th><th className="table-header">Должность</th><th className="table-header">Программа</th>
                    <th className="table-header">Статус прохождения</th><th className="table-header">Дата</th><th className="table-header">Срок действия</th><th className="table-header">Действия</th>
                  </tr></thead>
                  <tbody>
                    {programCompletions.map(c => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="table-cell font-medium">{c.full_name}</td>
                        <td className="table-cell text-gray-600">{c.position}</td>
                        <td className="table-cell text-gray-600">{c.program_name}</td>
                        <td className="table-cell">
                          <span className={`badge ${c.status === 'Пройдена' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                        </td>
                        <td className="table-cell text-sm">{c.date}</td>
                        <td className="table-cell text-sm">{c.valid_until}</td>
                        <td className="table-cell">
                          <button onClick={() => setEditingCompletion(c)} className="btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded" title="Редактировать">✏️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATTESTATIONS */}
          {tab === 'attestations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card p-4 text-center border-l-4 border-green-500">
                  <div className="text-2xl font-bold text-green-600">🎓</div>
                  <div className="text-sm font-medium mt-1">Первичная аттестация</div>
                  <div className="text-xs text-gray-400">PLG-INIT-001 · 240 ч.</div>
                </div>
                <div className="card p-4 text-center border-l-4 border-blue-500">
                  <div className="text-2xl font-bold text-blue-600">🔄</div>
                  <div className="text-sm font-medium mt-1">Периодическая ПК</div>
                  <div className="text-xs text-gray-400">PLG-REC-001 · 40 ч. · каждые 24 мес.</div>
                </div>
                <div className="card p-4 text-center border-l-4 border-purple-500">
                  <div className="text-2xl font-bold text-purple-600">✈️</div>
                  <div className="text-sm font-medium mt-1">Допуск на тип ВС</div>
                  <div className="text-xs text-gray-400">PLG-TYPE-001 · 80 ч.</div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-600 mt-6">Специальные курсы</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {['PLG-EWIS-001', 'PLG-FUEL-001', 'PLG-NDT-001', 'PLG-HF-001', 'PLG-SMS-001', 'PLG-CRS-001', 'PLG-RVSM-001', 'PLG-ETOPS-001'].map(pid => {
                  const p = programs.find(pp => pp.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} onClick={() => setSelectedProgram(p)}
                      className="card p-3 cursor-pointer hover:shadow-sm transition-shadow">
                      <div className="text-sm font-medium">{programTypeLabels[p.type] || p.type}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{p.duration_hours} ч.</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPLIANCE */}
          {tab === 'compliance' && compliance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4 text-center"><div className="text-3xl font-bold">{compliance.total_specialists}</div><div className="text-xs text-gray-500">Всего специалистов</div></div>
                <div className="card p-4 text-center bg-green-50"><div className="text-3xl font-bold text-green-600">{compliance.compliant}</div><div className="text-xs text-green-600">Соответствуют</div></div>
                <div className="card p-4 text-center bg-red-50"><div className="text-3xl font-bold text-red-600">{compliance.non_compliant}</div><div className="text-xs text-red-600">Нарушения</div></div>
                <div className="card p-4 text-center bg-yellow-50"><div className="text-3xl font-bold text-yellow-600">{compliance.expiring_soon?.length || 0}</div><div className="text-xs text-yellow-600">Истекает &lt;90 дн.</div></div>
              </div>

              {compliance.overdue?.length > 0 && (
                <div className="card p-4 border-l-4 border-red-500">
                  <h4 className="text-sm font-bold text-red-700 mb-2">⚠️ Просроченные квалификации</h4>
                  {compliance.overdue.map((o: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-red-100 text-sm">
                      <span className="font-medium">{o.specialist}</span>
                      <span className="text-gray-500">{o.program}</span>
                      <span className="text-red-600 text-xs">{new Date(o.due).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ))}
                </div>
              )}
              {compliance.expiring_soon?.length > 0 && (
                <div className="card p-4 border-l-4 border-yellow-500">
                  <h4 className="text-sm font-bold text-yellow-700 mb-2">⏰ Истекает в течение 90 дней</h4>
                  {compliance.expiring_soon.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-yellow-100 text-sm">
                      <span className="font-medium">{e.specialist}</span>
                      <span className="text-gray-500">{e.program || e.item}</span>
                      <span className="text-yellow-600 text-xs">{new Date(e.due).toLocaleDateString('ru-RU')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Specialist detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.full_name || ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Таб. №:</span> {selected.personnel_number}</div>
              <div><span className="text-gray-500">Категория:</span> <span className="badge bg-blue-100 text-blue-700">{selected.category}</span></div>
              <div><span className="text-gray-500">Должность:</span> {selected.position}</div>
              <div><span className="text-gray-500">Свидетельство:</span> {selected.license_number || '—'}</div>
              <div><span className="text-gray-500">Типы ВС:</span> {selected.specializations?.join(', ') || '—'}</div>
              <div><span className="text-gray-500">Действует до:</span> {selected.license_expires ? new Date(selected.license_expires).toLocaleDateString('ru-RU') : '—'}</div>
            </div>
            {selected.compliance && (
              <div className={`p-3 rounded text-sm ${selected.compliance.status === 'compliant' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {selected.compliance.status === 'compliant' ? '✅ Все квалификации в порядке' : `⚠️ Просрочено: ${selected.compliance.overdue_items?.join(', ')}`}
              </div>
            )}
            {selected.attestations?.length > 0 && (
              <div><h4 className="text-sm font-bold mb-2">Аттестации</h4>
                {selected.attestations.map((a: any) => (
                  <div key={a.id} className="flex justify-between py-1 border-b border-gray-50 text-xs">
                    <span>{a.program_name}</span><span className={a.result === 'passed' ? 'text-green-600' : 'text-red-600'}>{a.result}</span>
                  </div>
                ))}
              </div>
            )}
            {selected.qualifications?.length > 0 && (
              <div><h4 className="text-sm font-bold mb-2">Повышение квалификации</h4>
                {selected.qualifications.map((q: any) => (
                  <div key={q.id} className="flex justify-between py-1 border-b border-gray-50 text-xs">
                    <span>{q.program_name}</span><span>{q.next_due ? `до ${new Date(q.next_due).toLocaleDateString('ru-RU')}` : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Program detail modal */}
      <Modal isOpen={!!selectedProgram} onClose={() => setSelectedProgram(null)} title={selectedProgram?.name || ''} size="lg">
        {selectedProgram && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500">{selectedProgram.legal_basis}</div>
            <div className="flex gap-3 text-sm">
              <span className="badge bg-primary-100 text-primary-700">{selectedProgram.duration_hours} часов</span>
              {selectedProgram.periodicity && <span className="badge bg-yellow-100 text-yellow-700">{selectedProgram.periodicity}</span>}
              {selectedProgram.certificate_validity_years ? <span className="badge bg-green-100 text-green-700">Срок: {selectedProgram.certificate_validity_years} лет</span> : null}
            </div>
            {selectedProgram.modules && (
              <div>
                <h4 className="text-sm font-bold mb-2">Модули программы</h4>
                <div className="space-y-1">
                  {selectedProgram.modules.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
                      <div><span className="font-mono text-gray-400 mr-2">{m.code}</span>{m.name}</div>
                      <div className="flex gap-2 shrink-0">
                        {m.hours > 0 && <span className="badge bg-gray-100">{m.hours}ч</span>}
                        {m.basis && <span className="text-[10px] text-gray-400 max-w-[200px] truncate">{m.basis}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add specialist modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Добавить специалиста ПЛГ" size="lg">
        <AddSpecialistForm onSubmit={handleAddSpecialist} onCancel={() => setShowAddModal(false)} />
      </Modal>

      {/* Add program modal (демо — только локальное состояние) */}
      <Modal isOpen={showAddProgramModal} onClose={() => setShowAddProgramModal(false)} title="Добавить программу подготовки" size="md"
        footer={<><button onClick={() => setShowAddProgramModal(false)} className="btn-secondary">Отмена</button><button onClick={() => { setPrograms(prev => [...prev, { id: 'PLG-NEW-' + Date.now(), name: 'Новая программа', type: 'recurrent', duration_hours: 40, status: 'активна' }]); setShowAddProgramModal(false); }} className="btn-primary">Добавить</button></>}>
        <div className="text-sm text-gray-600">Программы подготовки задаются нормативными документами (ФАП-147 и др.). Для добавления кастомной программы обратитесь к администратору системы.</div>
      </Modal>

      {/* Edit completion modal */}
      <Modal isOpen={!!editingCompletion} onClose={() => setEditingCompletion(null)} title="Редактировать запись о прохождении" size="md"
        footer={<><button onClick={() => setEditingCompletion(null)} className="btn-secondary">Отмена</button><button onClick={() => setEditingCompletion(null)} className="btn-primary">Сохранить</button></>}>
        {editingCompletion && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><label className="text-gray-500">ФИО</label><div className="font-medium mt-1">{editingCompletion.full_name}</div></div>
            <div><label className="text-gray-500">Должность</label><div className="mt-1">{editingCompletion.position}</div></div>
            <div><label className="text-gray-500">Программа</label><div className="mt-1">{editingCompletion.program_name}</div></div>
            <div><label className="text-gray-500">Статус</label><div className="mt-1">{editingCompletion.status}</div></div>
            <div><label className="text-gray-500">Дата</label><div className="mt-1">{editingCompletion.date}</div></div>
            <div><label className="text-gray-500">Срок действия</label><div className="mt-1">{editingCompletion.valid_until}</div></div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}

function AddSpecialistForm({ onSubmit, onCancel }: { onSubmit: (d: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ full_name: '', personnel_number: '', position: 'Авиатехник', category: 'B1', specializations: '', license_number: '' });
  return (
    <div className="space-y-3">
      {[
        { key: 'full_name', label: 'ФИО', placeholder: 'Иванов Иван Иванович' },
        { key: 'personnel_number', label: 'Табельный номер', placeholder: 'ТН-001' },
        { key: 'position', label: 'Должность', placeholder: 'Авиатехник' },
        { key: 'license_number', label: 'Номер свидетельства', placeholder: 'АС-12345' },
        { key: 'specializations', label: 'Типы ВС (через запятую)', placeholder: 'Ан-148, SSJ-100' },
      ].map(f => (
        <div key={f.key}>
          <label className="text-xs font-medium text-gray-600">{f.label}</label>
          <input className="input-field w-full mt-1" placeholder={f.placeholder}
            value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
        </div>
      ))}
      <div>
        <label className="text-xs font-medium text-gray-600">Категория (EASA Part-66 / ФАП-147)</label>
        <select className="input-field w-full mt-1" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
          {['A', 'B1', 'B2', 'B3', 'C', 'I', 'II', 'III'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSubmit({ ...form, specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean) })}
          className="btn-primary px-4 py-2 rounded text-sm">Сохранить</button>
        <button onClick={onCancel} className="btn-sm bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">Отмена</button>
      </div>
    </div>
  );
}
