/**
 * Календарь ТО — визуализация плановых работ, дедлайнов AD, сроков ПК.
 * ФАП-148 п.3; EASA Part-M.A.302; ICAO Annex 6 Part I 8.3
 */
'use client';
import { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/ui';

interface CalEvent { id: string; title: string; date: string; type: string; }

const MO = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const TC: Record<string,string> = {
  scheduled:'bg-blue-500', ad_compliance:'bg-red-500', sb_compliance:'bg-orange-400',
  defect_rectification:'bg-yellow-500', unscheduled:'bg-purple-500',
  qualification_due:'bg-pink-500', life_limit:'bg-red-700',
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cur, setCur] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/work-orders/').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/v1/personnel-plg/compliance-report').then(r => r.json()).catch(() => ({ expiring_soon: [] })),
      fetch('/api/v1/airworthiness-core/life-limits').then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([wos, pers, lls]) => {
      const ev: CalEvent[] = [];
      (wos.items || []).forEach((w: any) => {
        const d = w.planned_start || w.created_at;
        if (d) ev.push({ id: w.id, title: `${w.wo_number}: ${(w.title||'').slice(0,25)}`, date: d.slice(0,10), type: w.wo_type });
      });
      (pers.expiring_soon || []).forEach((p: any) => {
        if (p.due) ev.push({ id: p.specialist+p.due, title: `ПК: ${(p.specialist||'').slice(0,20)}`, date: p.due.slice(0,10), type: 'qualification_due' });
      });
      (lls.items || []).filter((l: any) => l.remaining?.days > 0 && l.remaining.days < 90).forEach((l: any) => {
        const dd = new Date(); dd.setDate(dd.getDate() + l.remaining.days);
        ev.push({ id: l.id, title: `Ресурс: ${(l.component_name||'').slice(0,20)}`, date: dd.toISOString().slice(0,10), type: 'life_limit' });
      });
      setEvents(ev); setLoading(false);
    });
  }, []);

  const y = cur.getFullYear(), m = cur.getMonth();
  const sd = (new Date(y,m,1).getDay()+6)%7;
  const dim = new Date(y,m+1,0).getDate();
  const days = useMemo(() => {
    const a: (number|null)[] = [];
    for (let i=0;i<sd;i++) a.push(null);
    for (let d=1;d<=dim;d++) a.push(d);
    return a;
  }, [sd, dim]);

  const evFor = (d: number) => {
    const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return events.filter(e => e.date === ds);
  };
  const td = new Date();

  return (
    <PageLayout title="📅 Календарь ТО" subtitle="Плановые работы, дедлайны AD, сроки ПК, ресурсы">
      {loading && <div className="text-center py-4 text-gray-400">⏳ Загрузка...</div>}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCur(new Date(y,m-1,1))} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">←</button>
        <h2 className="text-lg font-bold">{MO[m]} {y}</h2>
        <button onClick={() => setCur(new Date(y,m+1,1))} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">→</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4 text-[10px]">
        {[['scheduled','Плановое ТО'],['ad_compliance','ДЛГ'],['sb_compliance','SB'],['defect_rectification','Дефект'],['qualification_due','ПК'],['life_limit','Ресурс']].map(([k,l]) => (
          <div key={k} className="flex items-center gap-1"><div className={`w-2.5 h-2.5 rounded-full ${TC[k]}`}/><span className="text-gray-500">{l}</span></div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {DW.map(d => <div key={d} className="bg-gray-50 px-2 py-1.5 text-center text-xs font-medium text-gray-500">{d}</div>)}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="bg-white min-h-[80px]"/>;
          const de = evFor(day);
          const isT = day===td.getDate() && m===td.getMonth() && y===td.getFullYear();
          return (
            <div key={day} className={`bg-white min-h-[80px] p-1 ${isT ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
              <div className={`text-xs font-medium mb-0.5 ${isT ? 'text-blue-600' : 'text-gray-600'}`}>{day}</div>
              <div className="space-y-0.5">
                {de.slice(0,3).map((e,j) => <div key={j} className={`text-[9px] text-white px-1 py-0.5 rounded truncate ${TC[e.type]||'bg-gray-400'}`} title={e.title}>{e.title}</div>)}
                {de.length > 3 && <div className="text-[9px] text-gray-400 px-1">+{de.length-3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}
