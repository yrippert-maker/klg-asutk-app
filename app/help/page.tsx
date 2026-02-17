'use client';
import { useState } from 'react';
import { PageLayout } from '@/components/ui';
import HelpDocumentModal from '@/components/HelpDocumentModal';

const defaultContent = (name: string, ref?: string, articles?: string) =>
  `# ${name}\n\n${ref || ''}\n\n## Основные положения\n\nДокумент определяет требования и процедуры в области гражданской авиации.\n\n## Применимые статьи\n\n${articles || 'См. официальный источник.'}\n\n## Ссылки\n\nОфициальный текст документа публикуется на портале Минтранса РФ или в реестре ICAO/EASA.`;

const DOCS: { cat: string; items: { name: string; ref?: string; articles?: string; content?: string }[] }[] = [
  { cat: 'Законодательство РФ', items: [
    { name: 'Воздушный кодекс РФ', ref: '60-ФЗ от 19.03.1997', articles: 'ст. 8, 24.1, 28, 33, 35, 36, 37, 37.2, 52-54', content: defaultContent('Воздушный кодекс РФ', '60-ФЗ от 19.03.1997', 'ст. 8, 24.1, 28, 33, 35, 36, 37, 37.2, 52-54') },
    { name: 'ФЗ-488', ref: '30.12.2021', articles: 'ст. 37.2 — поддержание ЛГ', content: defaultContent('ФЗ-488', '30.12.2021', 'ст. 37.2 — поддержание лётной годности') },
    { name: 'ФЗ-152', ref: 'О персональных данных', articles: 'Защита ПДн в панели ФАВТ', content: defaultContent('ФЗ-152', 'О персональных данных', 'Защита ПДн в панели ФАВТ') },
  ]},
  { cat: 'ФАП', items: [
    { name: 'ФАП-145', ref: 'Организации по ТО', articles: 'п.A.30, A.35, A.42, A.50-65', content: defaultContent('ФАП-145', 'Организации по ТО', 'п.A.30, A.35, A.42, A.50-65') },
    { name: 'ФАП-147', ref: 'Учебные организации', articles: 'п.17 — программы подготовки', content: defaultContent('ФАП-147', 'Учебные организации', 'п.17 — программы подготовки') },
    { name: 'ФАП-148', ref: 'Поддержание ЛГ', articles: 'п.3, 4.2, 4.3, 4.5', content: defaultContent('ФАП-148', 'Поддержание ЛГ', 'п.3, 4.2, 4.3, 4.5') },
    { name: 'ФАП-246', ref: 'Сертификация эксплуатантов', articles: 'Процедуры сертификации', content: defaultContent('ФАП-246', 'Сертификация эксплуатантов', 'Процедуры сертификации') },
  ]},
  { cat: 'ICAO', items: [
    { name: 'Annex 6', ref: 'Operation', articles: 'Part I 8.3, 8.7 — ТО', content: defaultContent('ICAO Annex 6', 'Operation', 'Part I 8.3, 8.7 — ТО') },
    { name: 'Annex 19', ref: 'Safety Management', articles: 'SMS', content: defaultContent('ICAO Annex 19', 'Safety Management', 'SMS') },
    { name: 'Doc 9859', ref: 'SMM', articles: 'ch.2 — human factors', content: defaultContent('ICAO Doc 9859', 'SMM', 'ch.2 — human factors') },
  ]},
  { cat: 'EASA', items: [
    { name: 'Part-M', ref: 'Continuing Airworthiness', articles: 'A.301, A.302, A.403, A.501, A.901', content: defaultContent('EASA Part-M', 'Continuing Airworthiness', 'A.301, A.302, A.403, A.501, A.901') },
    { name: 'Part-145', ref: 'Maintenance Organisations', articles: 'A.30, A.35, A.42, A.50-65', content: defaultContent('EASA Part-145', 'Maintenance Organisations', 'A.30, A.35, A.42, A.50-65') },
  ]},
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<typeof DOCS[0]['items'][0] | null>(null);

  const filtered = DOCS.map(cat => ({
    ...cat,
    items: cat.items.filter(i => !search || [i.name, i.ref, i.articles].some(s => String(s).toLowerCase().includes(search.toLowerCase())))
  })).filter(cat => cat.items.length > 0);

  return (
    <PageLayout title="📚 Справка" subtitle="Нормативная база АСУ ТК">
      <input type="text" placeholder="🔍 Поиск по нормативной базе..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md px-3 py-2 rounded-lg bg-gray-100 text-sm mb-6 focus:ring-2 focus:ring-blue-500" />
      <div className="space-y-6">
        {filtered.map(cat => (
          <section key={cat.cat}>
            <h3 className="text-sm font-bold text-gray-600 mb-2">{cat.cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cat.items.map(item => (
                <div key={item.name} onClick={() => setSelectedDoc(item)} className="card p-3 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.ref}</div>
                  <div className="text-[10px] text-blue-600 mt-1">{item.articles}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <HelpDocumentModal isOpen={!!selectedDoc} onClose={() => setSelectedDoc(null)} doc={selectedDoc} />
    </PageLayout>
  );
}
