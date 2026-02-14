'use client';
import { Modal } from '@/components/ui';

interface Doc { id: string; name: string; type: string; aircraft: string; date: string; status: string; size: string; }
interface Props { isOpen: boolean; onClose: () => void; document: Doc | null; }

export default function DocumentViewModal({ isOpen, onClose, document: doc }: Props) {
  if (!doc) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={doc.name} size="md">
      <div className="space-y-3">
        <Info label="Тип" value={doc.type} />
        <Info label="ВС" value={doc.aircraft} />
        <Info label="Дата" value={doc.date} />
        <Info label="Статус" value={doc.status} />
        <Info label="Размер" value={doc.size} />
      </div>
    </Modal>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex"><span className="text-sm font-bold text-gray-600 w-24">{label}:</span><span className="text-sm">{value}</span></div>;
}
