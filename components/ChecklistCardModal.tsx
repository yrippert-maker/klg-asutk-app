'use client';
import { Modal, StatusBadge } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; checklist: any; onSave?: (data: any) => void; }

export default function ChecklistCardModal({ isOpen, onClose, checklist }: Props) {
  if (!checklist) return null;
  const items = checklist.checklistItems || checklist.items || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={checklist.name || 'Чек-лист'} size="lg">
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div><span className="font-bold text-gray-600">Тип:</span> {checklist.type || checklist.domain || '—'}</div>
        <div><span className="font-bold text-gray-600">Статус:</span> <StatusBadge status={checklist.status || 'draft'} /></div>
        <div><span className="font-bold text-gray-600">ВС:</span> {checklist.aircraft || '—'}</div>
        <div><span className="font-bold text-gray-600">Дата:</span> {checklist.date || '—'}</div>
        {checklist.inspector && <div><span className="font-bold text-gray-600">Инспектор:</span> {checklist.inspector}</div>}
        {checklist.operator && <div><span className="font-bold text-gray-600">Оператор:</span> {checklist.operator}</div>}
      </div>
      {items.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-600 mb-2">Пункты ({items.length})</h4>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {items.map((item: any, i: number) => (
              <div key={item.id || i} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${item.checked ? 'bg-green-500 text-white border-green-500' : 'border-gray-300'}`}>
                  {item.checked && '✓'}
                </span>
                <span className="text-xs font-mono text-primary-500 min-w-[60px]">{item.code || ''}</span>
                <span className="text-sm flex-1">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
