'use client';
import { Modal, StatusBadge, DataTable } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; audit: any; onComplete?: () => void; }

export default function AuditCardModal({ isOpen, onClose, audit, onComplete }: Props) {
  if (!audit) return null;
  const responses = audit.responses || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Аудит #${(audit.id || '').slice(0, 8)}`} size="lg"
      footer={<>
        <button onClick={onClose} className="btn-secondary">Закрыть</button>
        {audit.status === 'in_progress' && onComplete && <button onClick={onComplete} className="btn-primary bg-green-500 hover:bg-green-600">Завершить</button>}
      </>}>
      <div className="space-y-4">
        <div className="flex gap-3 items-center"><StatusBadge status={audit.status} /></div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-bold text-gray-600">ВС:</span> {audit.aircraft_id?.slice(0, 8) || '—'}</div>
          <div><span className="font-bold text-gray-600">Шаблон:</span> {audit.template_id?.slice(0, 8) || '—'}</div>
          {audit.planned_at && <div><span className="font-bold text-gray-600">План:</span> {new Date(audit.planned_at).toLocaleDateString('ru-RU')}</div>}
          {audit.completed_at && <div><span className="font-bold text-gray-600">Завершён:</span> {new Date(audit.completed_at).toLocaleDateString('ru-RU')}</div>}
        </div>
        {responses.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-600 mb-2">Ответы ({responses.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {responses.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.response === 'compliant' ? 'bg-green-500 text-white' : r.response === 'non_compliant' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>
                    {r.response === 'compliant' ? '✓' : r.response === 'non_compliant' ? '✗' : '?'}
                  </span>
                  <span className="text-sm flex-1">{r.item_text || r.item_code || `Пункт ${i + 1}`}</span>
                  {r.note && <span className="text-xs text-gray-400 truncate max-w-[200px]">{r.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {audit.findings && audit.findings.length > 0 && (
          <div className="p-4 bg-red-50 rounded">
            <h4 className="font-bold text-red-700 mb-2">Несоответствия ({audit.findings.length})</h4>
            {audit.findings.map((f: any, i: number) => (
              <div key={i} className="text-sm py-1 border-b border-red-100 last:border-0">{f.description || f.text || `Несоответствие ${i + 1}`}</div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
