/**
 * Регулятор — Минтранс, ФАВТ, Ространснадзор
 * Доступ: favt_inspector или admin.
 * Показывает ТОЛЬКО агрегированные данные согласно:
 *   - ВК РФ ст. 8, 24.1, 28, 33, 36, 37, 67, 68
 *   - ФАП-246, ФАП-285, ФГИС РЭВС
 *   - ICAO Annex 6, 7, 8, 19; Doc 9734, 9760, 9859
 *   - EASA Part-M, Part-CAMO, Part-145, Part-ARO
 * 
 * Разработчик: АО «REFLY»
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageLayout, DataTable, StatusBadge, EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/hooks/useI18n';

type Tab = 'overview' | 'aircraft' | 'certifications' | 'safety' | 'audits' | 'personnel';

interface OverviewData {
  aircraft: { total: number; airworthy: number; in_maintenance: number; grounded: number; decommissioned: number };
  organizations: { total: number };
  certification: { total_applications: number; pending: number; approved: number; rejected: number };
  safety: { total_risks: number; critical: number; high: number; unresolved: number };
  audits_last_30d: number;
  legal_basis: string[];
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Сводка', icon: '📊' },
  { id: 'aircraft', label: 'Реестр ВС', icon: '✈️' },
  { id: 'certifications', label: 'Сертификация', icon: '📋' },
  { id: 'safety', label: 'Безопасность', icon: '🛡️' },
  { id: 'audits', label: 'Аудиты', icon: '🔍' },
  { id: 'personnel' as Tab, label: 'Персонал ПЛГ', icon: '🎓' },
];

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Доступ ограничен</h1>
        <p className="text-gray-500 mb-4">
          Панель доступна уполномоченным сотрудникам Минтранса, ФАВТ и Ространснадзора.
        </p>
        <p className="text-xs text-gray-400">
          Основание: ВК РФ ст. 8 — Федеральные правила использования воздушного пространства.
          Для получения доступа обратитесь к администратору системы.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = 'primary' }: { label: string; value: number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.primary}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

function LegalBasisBadge({ items }: { items: string[] }) {
  return (
    <details className="text-xs text-gray-400 mt-3">
      <summary className="cursor-pointer hover:text-gray-600">📜 Правовые основания ({items.length})</summary>
      <ul className="mt-1 space-y-0.5 pl-4">
        {items.map((b, i) => <li key={i} className="list-disc">{b}</li>)}
      </ul>
    </details>
  );
}

export default function RegulatorPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [aircraftData, setAircraftData] = useState<any>(null);
  const [certData, setCertData] = useState<any>(null);
  const [safetyData, setSafetyData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [personnelData, setPersonnelData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(90);
  const [agency, setAgency] = useState<'mintrans' | 'favt' | 'rostransnadzor'>('favt');

  const DEMO_OVERVIEW: OverviewData = {
    aircraft: { total: 142, airworthy: 118, in_maintenance: 12, grounded: 8, decommissioned: 4 },
    organizations: { total: 28 },
    certification: { total_applications: 15, pending: 3, approved: 10, rejected: 2 },
    safety: { total_risks: 45, critical: 2, high: 8, unresolved: 5 },
    audits_last_30d: 7,
    legal_basis: ['ВК РФ ст. 8, 24.1, 28, 33, 36, 37', 'ФАП-246, ФАП-148', 'ICAO Annex 6/8/19'],
  };

  // Access control: only favt_inspector or admin
  const hasAccess = user?.role === 'favt_inspector' || user?.role === 'admin';

  const fetchData = useCallback(async (endpoint: string) => {
    try {
      const res = await fetch(`/api/v1/regulator/${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(`Regulator API error:`, e);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    setLoading(true);
    fetchData('overview').then(d => { setOverview(d || DEMO_OVERVIEW); setLoading(false); });
  }, [hasAccess, fetchData]);

  useEffect(() => {
    if (!hasAccess) return;
    if (tab === 'aircraft' && !aircraftData) fetchData('aircraft-register').then(setAircraftData);
    if (tab === 'certifications' && !certData) fetchData('certifications').then(setCertData);
    if (tab === 'safety' && !safetyData) fetchData(`safety-indicators?days=${days}`).then(setSafetyData);
    if (tab === 'audits' && !auditData) fetchData(`audits?days=${days}`).then(setAuditData);
    if (tab === 'personnel' && !personnelData) fetchData('personnel-summary').then(setPersonnelData);
  }, [tab, hasAccess, days, fetchData, aircraftData, certData, safetyData, auditData]);

  if (!hasAccess) return <AccessDenied />;

  const handlePdfExport = async () => {
    try {
      const res = await fetch('/api/v1/regulator/report/pdf');
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `favt_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const handleExport = async () => {
    const data = await fetchData('report');
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `favt_report_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <PageLayout
      title="🏛️ Регулятор — Минтранс, ФАВТ, Ространснадзор"
      subtitle="Минтранс России · Федеральное агентство воздушного транспорта · Ространснадзор"
      actions={
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-sm bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1">
            📄 JSON отчёт
          </button>
          <button onClick={handlePdfExport} className="btn-sm bg-red-600 text-white px-4 py-2 rounded flex items-center gap-1">
            📑 PDF отчёт
          </button>
        </div>
      }
    >
      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-700">
        <strong>⚠️ Ограниченный доступ.</strong> Данные предоставляются в агрегированном виде согласно
        ВК РФ (60-ФЗ), ФАП-21/128/145/147/148/149/246, ФЗ-488, ICAO Annex 6/8/19, EASA Part-M/CAMO/145/ARO, Поручение Президента Пр-1379, ТЗ АСУ ТК.
        Персональные данные и коммерческая тайна не раскрываются.
      </div>

      {/* Ведомства */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(['mintrans', 'favt', 'rostransnadzor'] as const).map(a => (
          <button key={a} onClick={() => setAgency(a)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${agency === a ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
            {a === 'mintrans' ? 'Минтранс' : a === 'favt' ? 'ФАВТ' : 'Ространснадзор'}
          </button>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && !overview ? (
        <div className="text-center py-12 text-gray-400">⏳ Загрузка данных...</div>
      ) : (
        <>
          {/* === OVERVIEW TAB === */}
          {tab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Aircraft section — ВК РФ ст. 33, ICAO Annex 7 */}
              <section>
                <h3 className="text-sm font-bold text-gray-600 mb-3">✈️ Состояние парка ВС (ВК РФ ст. 33; ICAO Annex 7, 8)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  <StatCard label="Всего ВС" value={overview.aircraft.total} sub="Государственный реестр" />
                  <StatCard label="Годные к полётам" value={overview.aircraft.airworthy} color="green" sub="Действующий СЛГ" />
                  <StatCard label="На ТО" value={overview.aircraft.in_maintenance} color="yellow" sub="Плановое / внеплановое" />
                  <StatCard label="Приостановлены" value={overview.aircraft.grounded} color="red" sub="Ограничение / запрет" />
                  <StatCard label="Списаны" value={overview.aircraft.decommissioned} color="gray" sub="Исключены из реестра" />
                </div>
              </section>

              {/* Certification — ФАП-246, ICAO Annex 6 */}
              <section>
                <h3 className="text-sm font-bold text-gray-600 mb-3">📋 Сертификация эксплуатантов (ФАП-246; ICAO Annex 6)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Всего заявок" value={overview.certification.total_applications} />
                  <StatCard label="На рассмотрении" value={overview.certification.pending} color="yellow" sub="Ожидают решения" />
                  <StatCard label="Одобрено" value={overview.certification.approved} color="green" />
                  <StatCard label="Отклонено" value={overview.certification.rejected} color="red" />
                </div>
              </section>

              {/* Safety — ВК РФ ст. 24.1, ICAO Annex 19 */}
              <section>
                <h3 className="text-sm font-bold text-gray-600 mb-3">🛡️ Показатели безопасности (ГПБП; ICAO Annex 19; Doc 9859)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Всего рисков" value={overview.safety.total_risks} />
                  <StatCard label="Критические" value={overview.safety.critical} color="red" sub="Требуют немедленных мер" />
                  <StatCard label="Высокие" value={overview.safety.high} color="yellow" />
                  <StatCard label="Не устранены" value={overview.safety.unresolved} color="red" sub="Открытые риски" />
                </div>
              </section>

              {/* Audits + Orgs */}
              <section>
                <h3 className="text-sm font-bold text-gray-600 mb-3">🔍 Надзорная деятельность (ВК РФ ст. 28; ICAO Doc 9734)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <StatCard label="Аудитов за 30 дн." value={overview.audits_last_30d} color="primary" sub="Инспекции и проверки" />
                  <StatCard label="Организации" value={overview.organizations.total} sub="Подконтрольные субъекты" />
                </div>
              </section>

              <LegalBasisBadge items={overview.legal_basis || []} />
            </div>
          )}

          {/* === AIRCRAFT REGISTER TAB === */}
          {tab === 'aircraft' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">Данные аналогичны ФГИС РЭВС (приказ Росавиации № 180-П от 09.03.2017)</p>
              {aircraftData?.items?.length ? (
                <DataTable
                  columns={[
                    { key: 'registration_number', label: 'Рег. знак' },
                    { key: 'aircraft_type', label: 'Тип ВС' },
                    { key: 'status', label: 'Статус', render: (v: string) => (
                      <StatusBadge status={v} colorMap={{ active: 'bg-green-500', grounded: 'bg-red-500', maintenance: 'bg-yellow-500', decommissioned: 'bg-gray-400' }}
                        labelMap={{ active: 'Годен', grounded: 'Приостановлен', maintenance: 'На ТО', decommissioned: 'Списан' }} />
                    )},
                    { key: 'organization', label: 'Эксплуатант' },
                    { key: 'cert_expiry', label: 'СЛГ до', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
                  ]}
                  data={aircraftData.items}
                />
              ) : <EmptyState message="Нет данных в реестре" />}
              <LegalBasisBadge items={['ВК РФ ст. 33', 'ФГИС РЭВС (приказ № 180-П)', 'ICAO Annex 7']} />
            </div>
          )}

          {/* === CERTIFICATIONS TAB === */}
          {tab === 'certifications' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">Процедуры подтверждения соответствия по ФАП-246</p>
              {certData?.items?.length ? (
                <DataTable
                  columns={[
                    { key: 'id', label: '№', render: (v: string) => v?.slice(0, 8) },
                    { key: 'type', label: 'Тип' },
                    { key: 'status', label: 'Статус', render: (v: string) => (
                      <StatusBadge status={v} colorMap={{ pending: 'bg-yellow-500', approved: 'bg-green-500', rejected: 'bg-red-500', draft: 'bg-gray-400' }}
                        labelMap={{ pending: 'На рассмотрении', approved: 'Одобрена', rejected: 'Отклонена', draft: 'Черновик' }} />
                    )},
                    { key: 'organization', label: 'Организация' },
                    { key: 'submitted_at', label: 'Дата подачи', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
                  ]}
                  data={certData.items}
                />
              ) : <EmptyState message="Нет заявок на сертификацию" />}
              <LegalBasisBadge items={['ФАП-246 (приказ Минтранса № 246)', 'ICAO Annex 6 Part I', 'EASA Part-ORO']} />
            </div>
          )}

          {/* === SAFETY TAB === */}
          {tab === 'safety' && (
            <div className="space-y-4">
              <div className="flex gap-2 items-center mb-2">
                <span className="text-xs text-gray-500">Период:</span>
                {[30, 90, 180, 365].map(d => (
                  <button key={d} onClick={() => { setDays(d); setSafetyData(null); }}
                    className={`px-2.5 py-1 rounded text-xs ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {d}д
                  </button>
                ))}
              </div>

              {safetyData ? (
                <>
                  {/* Severity distribution */}
                  <div className="card p-4">
                    <h4 className="text-sm font-bold text-gray-600 mb-3">Распределение рисков по степени серьёзности</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {Object.entries(safetyData.severity_distribution || {}).map(([sev, cnt]) => (
                        <StatCard key={sev} label={sev} value={cnt as number}
                          color={sev === 'critical' ? 'red' : sev === 'high' ? 'yellow' : sev === 'medium' ? 'primary' : 'gray'} />
                      ))}
                    </div>
                  </div>

                  {/* Monthly trend */}
                  {safetyData.monthly_trend?.length > 0 && (
                    <div className="card p-4">
                      <h4 className="text-sm font-bold text-gray-600 mb-3">Динамика рисков по месяцам</h4>
                      <div className="flex items-end gap-2 h-32">
                        {safetyData.monthly_trend.map((m: any, i: number) => {
                          const maxC = Math.max(...safetyData.monthly_trend.map((t: any) => t.count), 1);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px] text-gray-500">{m.count}</span>
                              <div className="w-full bg-blue-500 rounded-t transition-all"
                                style={{ height: `${(m.count / maxC) * 100}%`, minHeight: '4px' }} />
                              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                                {m.month ? new Date(m.month).toLocaleDateString('ru-RU', { month: 'short' }) : '?'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="card p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <div className="text-lg font-bold text-red-700">{safetyData.critical_unresolved}</div>
                        <div className="text-xs text-red-600">Критических неустранённых рисков</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : <div className="text-center py-8 text-gray-400">Загрузка...</div>}
              <LegalBasisBadge items={['ВК РФ ст. 24.1 (ГПБП)', 'ICAO Annex 19', 'ICAO Doc 9859 (SMM)', 'EASA Part-ORO.GEN.200']} />
            </div>
          )}

          {/* === AUDITS TAB === */}
          {tab === 'audits' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">Результаты инспекционного контроля (ВК РФ ст. 28)</p>
              {auditData?.items?.length ? (
                <DataTable
                  columns={[
                    { key: 'id', label: '№', render: (v: string) => v?.slice(0, 8) },
                    { key: 'type', label: 'Тип проверки' },
                    { key: 'status', label: 'Результат', render: (v: string) => (
                      <StatusBadge status={v} colorMap={{ completed: 'bg-green-500', open: 'bg-yellow-500', failed: 'bg-red-500' }}
                        labelMap={{ completed: 'Завершён', open: 'В процессе', failed: 'Замечания' }} />
                    )},
                    { key: 'aircraft_reg', label: 'Рег. знак ВС' },
                    { key: 'conducted_at', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
                  ]}
                  data={auditData.items}
                />
              ) : <EmptyState message="Нет данных об аудитах" />}
              <LegalBasisBadge items={['ВК РФ ст. 28', 'ICAO Doc 9734 (Safety Oversight Manual)', 'EASA Part-ARO.GEN.300']} />
            </div>
          )}
        </>
      )}

      
          {/* === PERSONNEL PLG TAB === */}
          {tab === 'personnel' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-3">Агрегированные данные о персонале ПЛГ (ВК РФ ст. 52-54; ФАП-147; ICAO Annex 1)</p>
              {personnelData ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="card p-4 text-center"><div className="text-3xl font-bold">{personnelData.total_specialists}</div><div className="text-xs text-gray-500">Всего специалистов</div></div>
                    <div className="card p-4 text-center bg-green-50"><div className="text-3xl font-bold text-green-600">{personnelData.compliant}</div><div className="text-xs text-green-600">Квалификация в порядке</div></div>
                    <div className="card p-4 text-center bg-red-50"><div className="text-3xl font-bold text-red-600">{personnelData.non_compliant}</div><div className="text-xs text-red-600">Нарушения</div></div>
                    <div className="card p-4 text-center bg-blue-50"><div className="text-3xl font-bold text-blue-600">{personnelData.compliance_rate}%</div><div className="text-xs text-blue-600">Compliance rate</div></div>
                  </div>
                  {Object.keys(personnelData.by_category || {}).length > 0 && (
                    <div className="card p-4">
                      <h4 className="text-sm font-bold text-gray-600 mb-3">Распределение по категориям (EASA Part-66 / ФАП-147)</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(personnelData.by_category).map(([cat, cnt]) => (
                          <div key={cat} className="text-center p-2 rounded bg-gray-50">
                            <div className="text-lg font-bold">{cnt as number}</div>
                            <div className="text-xs text-gray-500">Кат. {cat}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400">Персональные данные (ФИО, табельные номера) не раскрываются (ФЗ-152)</div>
                </>
              ) : <div className="text-center py-8 text-gray-400">Загрузка...</div>}
            </div>
          )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400 space-y-1">
        <div>Данные предоставлены из АСУ ТК КЛГ согласно ТЗ (утв. 24.07.2022) и Поручению Президента Пр-1379. Агрегированные показатели — коммерческая тайна и ПДн не раскрываются.</div>
        <div>Система соответствует требованиям ФЗ-152 «О персональных данных» и ФЗ-149 «Об информации».</div>
        <div>© {new Date().getFullYear()} АО «REFLY» — Разработчик АСУ ТК</div>
      </div>
    </PageLayout>
  );
}
