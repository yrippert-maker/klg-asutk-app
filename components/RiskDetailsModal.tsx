'use client';
import { Modal, StatusBadge } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; risk: any; onResolve?: () => void; }

export default function RiskDetailsModal({ isOpen, onClose, risk, onResolve }: Props) {
  if (!risk) return null;
  const severity = risk.severity || risk.level;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={risk.title || 'Предупреждение'} size="lg"
      footer={<>
        <button onClick={onClose} className="btn-secondary">Закрыть</button>
        {!risk.is_resolved && onResolve && <button onClick={onResolve} className="btn-primary bg-green-500 hover:bg-green-600">✓ Пометить решённым</button>}
      </>}>
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <StatusBadge status={severity} />
          {risk.is_resolved && <span className="badge bg-green-100 text-green-700">✓ Решено</span>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-bold text-gray-600">ВС:</span> {risk.aircraft || risk.aircraft_id?.slice(0, 8) || '—'}</div>
          <div><span className="font-bold text-gray-600">Тип:</span> {risk.entity_type || risk.category || '—'}</div>
          <div><span className="font-bold text-gray-600">Дата:</span> {risk.date || (risk.created_at ? new Date(risk.created_at).toLocaleDateString('ru-RU') : '—')}</div>
          {risk.deadline && <div><span className="font-bold text-gray-600">Срок:</span> {risk.deadline}</div>}
          {risk.responsible && <div className="col-span-2"><span className="font-bold text-gray-600">Ответственный:</span> {risk.responsible}</div>}
        </div>
        {risk.description && <div className="p-4 bg-gray-50 rounded text-sm leading-relaxed"><h4 className="font-bold text-gray-600 mb-2">Описание</h4>{risk.description}</div>}
        {risk.message && <div className="p-4 bg-gray-50 rounded text-sm leading-relaxed">{risk.message}</div>}
        {risk.impact && <div className="p-4 bg-orange-50 rounded text-sm"><h4 className="font-bold text-orange-700 mb-1">Влияние</h4>{risk.impact}</div>}
        {risk.mitigation && <div className="p-4 bg-blue-50 rounded text-sm"><h4 className="font-bold text-blue-700 mb-1">Меры</h4><pre className="whitespace-pre-wrap font-sans">{risk.mitigation}</pre></div>}
      </div>
    </Modal>
  );
}
