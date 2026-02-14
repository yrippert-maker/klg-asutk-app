'use client';
import { Modal } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; regulation: any; }

export default function RegulationViewModal({ isOpen, onClose, regulation }: Props) {
  if (!regulation) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={regulation.title || regulation.name || 'Документ'} size="lg">
      <div className="space-y-4">
        {regulation.number && <div><span className="text-sm font-bold text-gray-600">Номер:</span> <span className="text-sm">{regulation.number}</span></div>}
        {regulation.source && <div><span className="text-sm font-bold text-gray-600">Источник:</span> <span className="text-sm">{regulation.source}</span></div>}
        {regulation.type && <div><span className="text-sm font-bold text-gray-600">Тип:</span> <span className="text-sm">{regulation.type}</span></div>}
        {regulation.effectiveDate && <div><span className="text-sm font-bold text-gray-600">Дата:</span> <span className="text-sm">{regulation.effectiveDate}</span></div>}
        {regulation.description && <div className="mt-4 p-4 bg-gray-50 rounded text-sm leading-relaxed">{regulation.description}</div>}
        {regulation.sections && regulation.sections.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-bold mb-2">Разделы:</h4>
            {regulation.sections.map((s: any, i: number) => (
              <div key={i} className="p-3 border-b border-gray-100"><span className="font-bold text-primary-500 mr-2">{s.number}</span><span className="text-sm">{s.title}</span></div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
