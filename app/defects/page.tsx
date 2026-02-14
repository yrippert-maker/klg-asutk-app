'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageLayout, DataTable, StatusBadge, Modal, EmptyState } from '@/components/ui';

export default function DefectsPage() {
  const [defects, setDefects] = useState([] as any[]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');

  const api = useCallback(async (ep: string, opts?: RequestInit) => {
        const r = await fetch(`/api/v1/defects${ep}`, opts);
    return r.json();
  }, []);

  useEffect(() => {
    setLoading(true); api(`/${filter ? `?status=${filter}` : ""}`).then(d => { setDefects(d.items || []); });
  }, [api, filter]);


  const handleAdd = async (data: any) => {
    const r = await api('/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.id) { setDefects(p => [r, ...p]); setShowAdd(false); }
  };

  return (
    <>
      <PageLayout title="🛠️ Дефекты и неисправности" subtitle="ФАП-145 п.145.A.50; EASA Part-M.A.403"
      actions={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2 rounded">+ Зарегистрировать</button>}>
      <div className="flex gap-2 mb-4">
        {['', 'open', 'deferred', 'rectified', 'closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={filter === s ? 'px-3 py-1.5 rounded text-xs bg-blue-600 text-white' : 'px-3 py-1.5 rounded text-xs bg-gray-100 text-gray-600'}>
            {s || 'Все'}
          </button>
        ))}
      </div>
      {defects.length > 0 ? (
        <DataTable columns={[
          { key: 'aircraft_reg', label: 'Борт' },
          { key: 'ata_chapter', label: 'ATA' },
          { key: 'description', label: 'Описание' },
          { key: 'severity', label: 'Серьёзность', render: (v: string) => (
            <StatusBadge status={v} colorMap={{ critical: 'bg-red-500', major: 'bg-yellow-500', minor: 'bg-blue-500' }} />
          )},
          { key: 'discovered_during', label: 'Обнаружен' },
          { key: 'mel_reference', label: 'MEL', render: (v: string) => v || '—' },
          { key: 'status', label: 'Статус', render: (v: string) => (
            <StatusBadge status={v} colorMap={{ open: 'bg-red-500', deferred: 'bg-yellow-500', rectified: 'bg-green-500', closed: 'bg-gray-400' }}
              labelMap={{ open: 'Открыт', deferred: 'Отложен (MEL)', rectified: 'Устранён', closed: 'Закрыт' }} />
          )},
        ]} data={defects} />
      ) : <EmptyState message="Нет зарегистрированных дефектов" />}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Регистрация дефекта">
        <DefectForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>
    </PageLayout>
    </>
  );
}

function DefectForm({ onSubmit, onCancel }: { onSubmit: (d: any) => void; onCancel: () => void }) {
  const [f, setF] = useState({ aircraft_reg: '', ata_chapter: '', description: '', severity: 'minor', discovered_during: 'preflight' });
  return (
    <div className="space-y-3">
      <div><label className="text-xs font-medium text-gray-600">Борт (рег. знак)</label>
        <input className="input-field w-full mt-1" value={f.aircraft_reg} onChange={e => setF(p => ({ ...p, aircraft_reg: e.target.value }))} /></div>
      <div><label className="text-xs font-medium text-gray-600">ATA Chapter</label>
        <input className="input-field w-full mt-1" placeholder="32" value={f.ata_chapter} onChange={e => setF(p => ({ ...p, ata_chapter: e.target.value }))} /></div>
      <div><label className="text-xs font-medium text-gray-600">Описание дефекта</label>
        <textarea className="input-field w-full mt-1" rows={3} value={f.description} onChange={e => setF(p => ({ ...p, description: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-gray-600">Серьёзность</label>
          <select className="input-field w-full mt-1" value={f.severity} onChange={e => setF(p => ({ ...p, severity: e.target.value }))}>
            <option value="critical">Критический</option><option value="major">Значительный</option><option value="minor">Незначительный</option>
          </select></div>
        <div><label className="text-xs font-medium text-gray-600">Обнаружен при</label>
          <select className="input-field w-full mt-1" value={f.discovered_during} onChange={e => setF(p => ({ ...p, discovered_during: e.target.value }))}>
            <option value="preflight">Предполётный</option><option value="transit">Транзит</option><option value="daily">Ежедневный</option>
            <option value="a_check">A-check</option><option value="c_check">C-check</option><option value="report">Донесение экипажа</option>
          </select></div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSubmit(f)} className="btn-primary px-4 py-2 rounded text-sm">Сохранить</button>
        <button onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">Отмена</button>
      </div>
    </div>
  );
}
