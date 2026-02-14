/**
 * Главная панель — Dashboard
 * Интеграция всех модулей АСУ ТК: ВС, ДЛГ, ресурсы, персонал, риски, аудиты
 */
'use client';
import { useState, useEffect } from 'react';
import { PageLayout, StatusBadge } from '@/components/ui';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/api-client';

interface DashboardData {
  overview: any; directives: any; lifeLimits: any; personnel: any; risks: any;
}

function StatCard({ label, value, sub, color, href }: { label: string; value: number | string; sub?: string; color: string; href?: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  const card = (
    <div className={`rounded-lg border p-4 ${colors[color]} ${href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function DashboardPage() {
  const [data, setData] = useState<Partial<DashboardData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/stats').catch(() => null),
      apiFetch<{ total?: number; items?: unknown[] }>('/airworthiness-core/directives?status=open').catch(() => ({ total: 0, items: [] })),
      apiFetch<{ total?: number; items?: unknown[] }>('/airworthiness-core/life-limits').catch(() => ({ total: 0, items: [] })),
      apiFetch('/personnel-plg/compliance-report').catch(() => null),
      apiFetch<{ total?: number }>('/risk-alerts').catch(() => ({ total: 0 })),
      apiFetch<{ total?: number; in_progress?: number; aog?: number }>('/work-orders/stats/summary').catch(() => ({ total: 0, in_progress: 0, aog: 0 })),
      apiFetch<{ total?: number }>('/defects/?status=open').catch(() => ({ total: 0 })),
      apiFetch<{ connection_status?: string }>('/fgis-revs/status').catch(() => ({ connection_status: 'unknown' })),
    ]).then(([overview, directives, lifeLimits, personnel, risks, woStats, openDefects, fgisStatus]) => {
      setData({ overview, directives, lifeLimits, personnel, risks, woStats, openDefects, fgisStatus });
      setLoading(false);
    });
  }, []);

  const criticalLL = data.lifeLimits?.items?.filter((ll: any) => ll.critical)?.length || 0;
  const openADs = data.directives?.total || 0;
  const personnelIssues = data.personnel?.non_compliant || 0;

  return (
    <PageLayout title="📊 Дашборд АСУ ТК" subtitle="Калининградский филиал — контроль лётной годности">
      {loading ? <div className="text-center py-16 text-gray-400">⏳ Загрузка данных...</div> : (
        <div className="space-y-6">
          {/* Critical alerts banner */}
          {(openADs > 0 || criticalLL > 0 || personnelIssues > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-red-700 mb-2">⚠️ Требуют внимания</h3>
              <div className="flex gap-4 text-sm text-red-600">
                {openADs > 0 && <span>• {openADs} открытых ДЛГ</span>}
                {criticalLL > 0 && <span>• {criticalLL} критических ресурсов</span>}
                {personnelIssues > 0 && <span>• {personnelIssues} просроченных квалификаций</span>}
              {(data as any).fgisStatus?.connection_status === 'mock' && (
                <span>• ФГИС РЭВС: тестовый режим</span>
              )}
              </div>
            </div>
          )}

          {/* Aircraft fleet */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">✈️ Парк воздушных судов</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard label="Всего ВС" value={data.overview?.aircraft?.total || 0} color="blue" href="/aircraft" />
              <StatCard label="Годные" value={data.overview?.aircraft?.active || 0} color="green" sub="Действующий СЛГ" />
              <StatCard label="На ТО" value={data.overview?.aircraft?.maintenance || 0} color="yellow" href="/maintenance" />
              <StatCard label="Приостановлены" value={data.overview?.aircraft?.grounded || 0} color="red" />
              <StatCard label="Организации" value={data.overview?.organizations?.total || 0} color="gray" href="/organizations" />
            </div>
          </section>

          {/* Airworthiness Core */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">🔧 Контроль лётной годности</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Открытые ДЛГ" value={openADs} color={openADs > 0 ? 'red' : 'green'} sub="Директивы ЛГ" href="/airworthiness-core" />
              <StatCard label="Критич. ресурсы" value={criticalLL} color={criticalLL > 0 ? 'red' : 'green'} sub="Life Limits" href="/airworthiness-core" />
              <StatCard label="Компоненты" value={data.lifeLimits?.total || 0} color="blue" sub="На контроле" href="/airworthiness-core" />
              <StatCard label="Бюллетени" value={0} color="blue" sub="Сервисные SB" href="/airworthiness-core" />
            </div>
          </section>

          {/* Personnel PLG */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">🎓 Персонал ПЛГ</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Специалисты" value={data.personnel?.total_specialists || 0} color="blue" href="/personnel-plg" />
              <StatCard label="Квалификация ОК" value={data.personnel?.compliant || 0} color="green" />
              <StatCard label="Нарушения" value={personnelIssues} color={personnelIssues > 0 ? 'red' : 'green'} href="/personnel-plg" />
              <StatCard label="Истекает ≤90д" value={data.personnel?.expiring_soon?.length || 0} color="yellow" />
            </div>
          </section>

          
          {/* Work Orders & Defects */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">📐 ТО и дефекты</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard label="Наряды в работе" value={(data as any).woStats?.in_progress || 0} color="blue" href="/maintenance" />
              <StatCard label="AOG" value={(data as any).woStats?.aog || 0} color={(data as any).woStats?.aog > 0 ? 'red' : 'green'} sub="ВС на земле" href="/maintenance" />
              <StatCard label="Открытые дефекты" value={(data as any).openDefects?.total || 0} color={(data as any).openDefects?.total > 0 ? 'yellow' : 'green'} href="/defects" />
              <StatCard label="Закрыто нарядов" value={(data as any).woStats?.closed || 0} color="green" />
              <StatCard label="Человеко-часы" value={(data as any).woStats?.total_manhours || 0} color="purple" sub="Факт. (закрытые)" />
            </div>
          </section>

          {/* Safety & Audits */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">🛡️ Безопасность и аудиты</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Всего рисков" value={data.overview?.risks?.total || 0} color="blue" href="/risks" />
              <StatCard label="Критические" value={data.overview?.risks?.critical || 0} color="red" />
              <StatCard label="Заявки" value={data.overview?.cert_applications?.total || 0} color="purple" href="/applications" />
              <StatCard label="Аудиты" value={data.overview?.audits?.total || 0} color="blue" href="/audits" />
            </div>
          </section>

          
          {/* Charts */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">📈 Тренды</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-4">
                <h4 className="text-xs font-medium text-gray-500 mb-3">Наряды на ТО по месяцам</h4>
                <WOChart />
              </div>
              <div className="card p-4">
                <h4 className="text-xs font-medium text-gray-500 mb-3">Распределение дефектов по серьёзности</h4>
                <DefectChart />
              </div>
            </div>
          </section>

          {/* Quick links */}
          <section>
            <h3 className="text-sm font-bold text-gray-600 mb-3">⚡ Быстрый доступ</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { href: '/airworthiness-core', label: '🔧 Контроль ЛГ', desc: 'AD, SB, ресурсы, компоненты' },
                { href: '/personnel-plg', label: '🎓 Персонал ПЛГ', desc: 'Аттестация, ПК, 11 программ' },
                { href: '/checklists', label: '✅ Чек-листы', desc: 'Инспекции и проверки' },
                { href: '/regulator', label: '🏛️ Панель ФАВТ', desc: 'Данные для регулятора' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="card p-3 hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium">{l.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{l.desc}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </PageLayout>
  );
}

function WOChart() {
  const data = [
    { month: 'Сен', closed: 12, opened: 15 },
    { month: 'Окт', closed: 18, opened: 14 },
    { month: 'Ноя', closed: 22, opened: 20 },
    { month: 'Дек', closed: 16, opened: 19 },
    { month: 'Янв', closed: 25, opened: 21 },
    { month: 'Фев', closed: 14, opened: 11 },
  ];
  // Simple bar chart using divs (no recharts dep needed in artifact)
  const max = Math.max(...data.flatMap(d => [d.closed, d.opened]));
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex gap-0.5 items-end justify-center h-24">
            <div className="w-3 bg-green-400 rounded-t" style={{ height: `${(d.closed / max) * 100}%` }}
              title={`Закрыто: ${d.closed}`} />
            <div className="w-3 bg-blue-400 rounded-t" style={{ height: `${(d.opened / max) * 100}%` }}
              title={`Открыто: ${d.opened}`} />
          </div>
          <span className="text-[9px] text-gray-400">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function DefectChart() {
  const data = [
    { label: 'Критические', value: 3, color: 'bg-red-500' },
    { label: 'Значительные', value: 12, color: 'bg-yellow-500' },
    { label: 'Незначительные', value: 28, color: 'bg-blue-400' },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-28">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div className={`${d.color} h-full rounded-full flex items-center justify-end pr-2 transition-all`}
              style={{ width: `${(d.value / total) * 100}%` }}>
              <span className="text-[10px] text-white font-bold">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="text-right text-[10px] text-gray-400">Всего: {total}</div>
    </div>
  );
}
