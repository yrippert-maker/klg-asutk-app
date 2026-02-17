'use client';
import { useState, useEffect, useCallback } from 'react';
import { PageLayout, DataTable, StatusBadge, Modal, EmptyState } from '@/components/ui';

const DEMO_DEFECTS = [
  { id: '1', defect_number: 'DEF-2024-001', aircraft_reg: 'RA-73001', ata_chapter: '32', description: 'Утечка гидравлической жидкости в районе стойки шасси', severity: 'critical', discovered_date: '2024-11-20', discovered_during: 'preflight', status: 'open', responsible: 'Иванов И.И.', corrective_actions: 'Замена уплотнений', mel_reference: '32-01-01', history: [{ date: '2024-11-20', action: 'Зарегистрирован', user: 'Иванов И.И.' }] },
  { id: '2', defect_number: 'DEF-2024-002', aircraft_reg: 'RA-73002', ata_chapter: '33', description: 'Нестабильные показания датчика освещённости', severity: 'major', discovered_date: '2024-11-18', discovered_during: 'daily', status: 'deferred', responsible: 'Петров П.П.', mel_reference: '33-02-01', history: [{ date: '2024-11-18', action: 'Зарегистрирован' }, { date: '2024-11-19', action: 'Отложен по MEL' }] },
  { id: '3', defect_number: 'DEF-2024-003', aircraft_reg: 'VQ-BAB', ata_chapter: '21', description: 'Потёртость уплотнения двери салона', severity: 'minor', discovered_date: '2024-11-15', discovered_during: 'a_check', status: 'rectified', responsible: 'Сидорова А.С.', corrective_actions: 'Замена уплотнения', history: [{ date: '2024-11-15', action: 'Зарегистрирован' }, { date: '2024-11-16', action: 'Устранён' }] },
  { id: '4', defect_number: 'DEF-2024-004', aircraft_reg: 'RA-73003', ata_chapter: '80', description: 'Повышенная вибрация двигателя №1', severity: 'critical', discovered_date: '2024-12-01', discovered_during: 'report', status: 'open', responsible: 'Козлов М.А.', corrective_actions: 'Диагностика, возможна замена двигателя', history: [{ date: '2024-12-01', action: 'Зарегистрирован по донесению экипажа' }] },
  { id: '5', defect_number: 'DEF-2024-005', aircraft_reg: 'RA-73005', ata_chapter: '27', description: 'Не работает подсветка панели', severity: 'minor', discovered_date: '2024-11-25', discovered_during: 'transit', status: 'closed', responsible: 'Новикова Е.В.', corrective_actions: 'Замена лампы', history: [{ date: '2024-11-25', action: 'Зарегистрирован' }, { date: '2024-11-26', action: 'Устранён' }, { date: '2024-11-26', action: 'Закрыт' }] },
  { id: '6', defect_number: 'DEF-2024-006', aircraft_reg: 'RA-73001', ata_chapter: '36', description: 'Срабатывание сигнализации давления в пневмосистеме', severity: 'major', discovered_date: '2024-11-28', discovered_during: 'preflight', status: 'open', responsible: 'Иванов И.И.', history: [{ date: '2024-11-28', action: 'Зарегистрирован' }] },
  { id: '7', defect_number: 'DEF-2024-007', aircraft_reg: 'RA-73006', ata_chapter: '52', description: 'Трещина остекления кабины (незначительная)', severity: 'minor', discovered_date: '2024-11-22', discovered_during: 'daily', status: 'rectified', responsible: 'Морозова Е.И.', corrective_actions: 'Замена остекления', history: [{ date: '2024-11-22', action: 'Зарегистрирован' }, { date: '2024-11-24', action: 'Устранён' }] },
];

const SEV_COLORS: Record<string, string> = { critical: 'bg-red-500', major: 'bg-orange-500', minor: 'bg-yellow-500' };
const SEV_LABELS: Record<string, string> = { critical: 'Критический', major: 'Значительный', minor: 'Незначительный' };
const STATUS_LABELS: Record<string, string> = { open: 'Открыт', deferred: 'Отложен (MEL)', rectified: 'Устранён', closed: 'Закрыт' };

export default function DefectsPage() {
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const api = useCallback(async (ep: string, opts?: RequestInit) => {
    const r = await fetch(`/api/v1/defects${ep}`, opts);
    return r.json();
  }, []);

  useEffect(() => {
    setLoading(true);
    api(`/${filter ? `?status=${filter}` : ''}`)
      .then(d => setDefects(Array.isArray(d?.items) && d.items.length > 0 ? d.items : DEMO_DEFECTS))
      .catch(() => setDefects(DEMO_DEFECTS))
      .finally(() => setLoading(false));
  }, [api, filter]);

  const displayDefects = filter ? defects.filter(d => d.status === filter) : defects;

  const handleAdd = async (data: any) => {
    const r = await api('/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.id) { setDefects(p => [r, ...p]); setShowAdd(false); }
  };

  const handleCloseDefect = (id: string) => {
    if (!confirm('Закрыть дефект?')) return;
    setDefects(prev => prev.map(d => d.id === id ? { ...d, status: 'closed' } : d));
    setSelected(null);
  };

  const downloadReport = (d: any) => {
    const lines = [`Отчёт по дефекту ${d.defect_number || d.id}`, `Борт: ${d.aircraft_reg}`, `ATA: ${d.ata_chapter}`, `Описание: ${d.description}`, `Серьёзность: ${SEV_LABELS[d.severity] || d.severity}`, `Дата обнаружения: ${d.discovered_date || '—'}`, `Статус: ${STATUS_LABELS[d.status]}`, `Ответственный: ${d.responsible || '—'}`, d.corrective_actions ? `Корректирующие действия: ${d.corrective_actions}` : '', 'История:', ...(d.history || []).map((h: any) => `  ${h.date} — ${h.action}`)];
    const blob = new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `defect_${d.defect_number || d.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageLayout title="🛠️ Дефекты и неисправности" subtitle="ФАП-145 п.145.A.50; EASA Part-M.A.403"
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-4 py-2 rounded">+ Зарегистрировать</button>}>
        <div className="flex gap-2 mb-4">
          {['', 'open', 'deferred', 'rectified', 'closed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={filter === s ? 'px-3 py-1.5 rounded text-xs bg-blue-600 text-white' : 'px-3 py-1.5 rounded text-xs bg-gray-100 text-gray-600'}>
              {STATUS_LABELS[s] || 'Все'}
            </button>
          ))}
        </div>
        {displayDefects.length > 0 ? (
          <DataTable columns={[
            { key: 'defect_number', label: '№', render: (_: any, row: any) => row.defect_number || row.id },
            { key: 'aircraft_reg', label: 'Борт' },
            { key: 'ata_chapter', label: 'ATA' },
            { key: 'description', label: 'Описание', render: (v: string) => <span className="line-clamp-1">{v || '—'}</span> },
            { key: 'severity', label: 'Серьёзность', render: (v: string) => (
              <StatusBadge status={v} colorMap={SEV_COLORS} labelMap={SEV_LABELS} />
            )},
            { key: 'discovered_date', label: 'Дата', render: (v: string) => v ? new Date(v).toLocaleDateString('ru-RU') : '—' },
            { key: 'status', label: 'Статус', render: (v: string) => (
              <StatusBadge status={v} colorMap={{ open: 'bg-red-500', deferred: 'bg-yellow-500', rectified: 'bg-green-500', closed: 'bg-gray-400' }} labelMap={STATUS_LABELS} />
            )},
          ]} data={displayDefects} onRowClick={setSelected} />
        ) : <EmptyState message="Нет зарегистрированных дефектов" />}

        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Дефект ${selected.defect_number || selected.id}` : ''} size="lg"
          footer={selected ? (
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="btn-secondary">Редактировать</button>
              <button onClick={() => downloadReport(selected)} className="btn-primary">Скачать отчёт</button>
              {selected.status !== 'closed' && <button onClick={() => handleCloseDefect(selected.id)} className="btn-sm bg-green-600 text-white">Закрыть дефект</button>}
              <button onClick={() => setSelected(null)} className="btn-secondary">Закрыть</button>
            </div>
          ) : undefined}>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className={`p-2 rounded border-l-4 ${selected.severity === 'critical' ? 'bg-red-50 border-red-500' : selected.severity === 'major' ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50 border-yellow-500'}`}>
                <span className="font-medium">{SEV_LABELS[selected.severity] || selected.severity}</span>
              </div>
              <div><span className="text-gray-500">Описание</span><p className="mt-1">{selected.description}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Борт</span><div>{selected.aircraft_reg}</div></div>
                <div><span className="text-gray-500">ATA</span><div>{selected.ata_chapter}</div></div>
                <div><span className="text-gray-500">Дата обнаружения</span><div>{selected.discovered_date ? new Date(selected.discovered_date).toLocaleDateString('ru-RU') : '—'}</div></div>
                <div><span className="text-gray-500">Ответственный</span><div>{selected.responsible || '—'}</div></div>
                <div><span className="text-gray-500">MEL</span><div>{selected.mel_reference || '—'}</div></div>
              </div>
              {selected.corrective_actions && <div><span className="text-gray-500">Корректирующие действия</span><p className="mt-1">{selected.corrective_actions}</p></div>}
              <div><span className="text-gray-500">Фото/вложения</span><p className="mt-1 text-gray-400 text-xs">Фото прилагаются к дефекту в системе учёта</p></div>
              <div><h4 className="font-medium text-gray-700 mb-2">История</h4><ul className="space-y-1 text-gray-600">{(selected.history || []).map((h: any, i: number) => <li key={i}>{h.date} — {h.action}{h.user ? ` (${h.user})` : ''}</li>)}</ul></div>
            </div>
          )}
        </Modal>

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
