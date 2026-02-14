'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CRSContent() {
  const params = useSearchParams();
  const woId = params.get('wo_id');
  const [wo, setWo] = useState<any>(null);

  useEffect(() => {
    if (woId) fetch(`/api/v1/work-orders/${woId}`).then(r => r.json()).then(setWo);
  }, [woId]);

  useEffect(() => { if (wo?.crs_signed_by) setTimeout(() => window.print(), 500); }, [wo]);
  if (!wo) return <div className="p-8 text-center text-gray-400">Загрузка...</div>;

  return (
    <div className="max-w-[800px] mx-auto p-8 font-serif text-sm">
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-lg font-bold">CERTIFICATE OF RELEASE TO SERVICE</h1>
        <h2 className="text-base">СВИДЕТЕЛЬСТВО О ДОПУСКЕ К ЭКСПЛУАТАЦИИ</h2>
        <p className="text-xs text-gray-500 mt-1">ФАП-145 п.145.A.50 | EASA Part-145.A.50</p>
      </div>
      <table className="w-full border-collapse mb-4">
        <tbody>
          {[['Наряд / WO No:', wo.wo_number], ['Борт:', wo.aircraft_reg], ['Тип:', wo.wo_type],
            ['Работы:', wo.title], ['План. ч/ч:', wo.estimated_manhours], ['Факт. ч/ч:', wo.actual_manhours || '—']
          ].map(([k, v], i) => (
            <tr key={i} className="border border-gray-300">
              <td className="px-2 py-1 bg-gray-100 font-medium w-1/3">{k}</td>
              <td className="px-2 py-1">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {wo.description && <div className="mb-4"><h3 className="font-bold text-xs text-gray-600 mb-1">Описание работ:</h3><p className="border p-2">{wo.description}</p></div>}
      {wo.findings && <div className="mb-4"><h3 className="font-bold text-xs text-gray-600 mb-1">Замечания:</h3><p className="border p-2">{wo.findings}</p></div>}
      <div className="border-2 border-black p-4 mt-6">
        <h3 className="font-bold text-center mb-3">RELEASE TO SERVICE / ДОПУСК К ЭКСПЛУАТАЦИИ</h3>
        <p className="text-xs mb-4">Certifies that the work specified was carried out in accordance with ФАП-145 / Part-145 and the aircraft is ready for release to service.</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div><div className="text-xs text-gray-500">Подписал:</div><div className="border-b border-black mt-6 pt-1 font-bold">{wo.crs_signed_by || '________________'}</div></div>
          <div><div className="text-xs text-gray-500">Дата:</div><div className="border-b border-black mt-6 pt-1">{wo.crs_date ? new Date(wo.crs_date).toLocaleDateString('ru-RU') : '________________'}</div></div>
        </div>
      </div>
      <div className="mt-6 text-[10px] text-gray-400 text-center">АСУ ТК КЛГ | {new Date().toLocaleDateString('ru-RU')}</div>
    </div>
  );
}

export default function CRSPrintPage() {
  return <Suspense fallback={<div className="p-8 text-center">Загрузка...</div>}><CRSContent /></Suspense>;
}
