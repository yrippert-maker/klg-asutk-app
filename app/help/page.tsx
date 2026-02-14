'use client';
import { useState } from 'react';
import { PageLayout } from '@/components/ui';

const DOCS = [
  { cat: 'Законодательство РФ', items: [
    { name: 'Воздушный кодекс РФ', ref: '60-ФЗ от 19.03.1997', articles: 'ст. 8, 24.1, 28, 33, 35, 36, 37, 37.2, 52-54' },
    { name: 'ФЗ-488', ref: '30.12.2021', articles: 'ст. 37.2 — поддержание ЛГ' },
    { name: 'ФЗ-152', ref: 'О персональных данных', articles: 'Защита ПДн в панели ФАВТ' },
  ]},
  { cat: 'ФАП (Федеральные авиационные правила)', items: [
    { name: 'ФАП-10', ref: 'Сертификация эксплуатантов', articles: 'Общие требования' },
    { name: 'ФАП-21', ref: 'Сертификация АТ', articles: 'Part-21 эквивалент' },
    { name: 'ФАП-128', ref: 'Подготовка и выполнение полётов', articles: 'Эксплуатация ВС' },
    { name: 'ФАП-145', ref: 'Организации по ТО', articles: 'п.A.30, A.35, A.42, A.50-65' },
    { name: 'ФАП-147', ref: 'Учебные организации', articles: 'п.17 — программы подготовки' },
    { name: 'ФАП-148', ref: 'Поддержание ЛГ', articles: 'п.3, 4.2, 4.3, 4.5' },
    { name: 'ФАП-149', ref: 'Инспектирование ГА', articles: 'Надзорные функции' },
    { name: 'ФАП-246', ref: 'Сертификация эксплуатантов', articles: 'Процедуры сертификации' },
  ]},
  { cat: 'ICAO', items: [
    { name: 'Annex 1', ref: 'Licensing', articles: 'Лицензирование персонала' },
    { name: 'Annex 6', ref: 'Operation', articles: 'Part I 8.3, 8.7 — ТО' },
    { name: 'Annex 8', ref: 'Airworthiness', articles: 'Part II 4.2 — ресурсы' },
    { name: 'Annex 19', ref: 'Safety Management', articles: 'SMS' },
    { name: 'Doc 9734', ref: 'Safety Oversight', articles: 'CE-7' },
    { name: 'Doc 9760', ref: 'Airworthiness Manual', articles: 'ch.6 — персонал' },
    { name: 'Doc 9859', ref: 'SMM', articles: 'ch.2 — human factors' },
  ]},
  { cat: 'EASA', items: [
    { name: 'Part-21', ref: 'Certification', articles: 'A.3B, A.97' },
    { name: 'Part-66', ref: 'Licensing', articles: 'A.25, A.30, A.40, A.45' },
    { name: 'Part-M', ref: 'Continuing Airworthiness', articles: 'A.301, A.302, A.403, A.501, A.901' },
    { name: 'Part-145', ref: 'Maintenance Organisations', articles: 'A.30, A.35, A.42, A.50-65' },
    { name: 'Part-CAMO', ref: 'Continuing Airworthiness Mgmt', articles: 'A.305' },
  ]},
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const filtered = DOCS.map(cat => ({
    ...cat,
    items: cat.items.filter(i => !search || [i.name, i.ref, i.articles].some(s => s.toLowerCase().includes(search.toLowerCase())))
  })).filter(cat => cat.items.length > 0);

  return (
    <PageLayout title="📚 Справка" subtitle="Нормативная база АСУ ТК — 19 документов">
      <input type="text" placeholder="🔍 Поиск по нормативной базе..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-3 py-2 rounded-lg bg-gray-100 text-sm mb-6 focus:ring-2 focus:ring-blue-500" />
      <div className="space-y-6">
        {filtered.map(cat => (
          <section key={cat.cat}>
            <h3 className="text-sm font-bold text-gray-600 mb-2">{cat.cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cat.items.map(item => (
                <div key={item.name} className="card p-3">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.ref}</div>
                  <div className="text-[10px] text-blue-600 mt-1">{item.articles}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageLayout>
  );
}
