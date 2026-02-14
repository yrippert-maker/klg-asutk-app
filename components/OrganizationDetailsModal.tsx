'use client';
import { Modal, DataTable, StatusBadge } from '@/components/ui';
import { Aircraft } from '@/lib/api';

interface Props { isOpen: boolean; onClose: () => void; organization: string; aircraft: Aircraft[]; onEdit?: (a: Aircraft) => void; }

export default function OrganizationDetailsModal({ isOpen, onClose, organization, aircraft, onEdit }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={organization} size="lg">
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">Воздушные суда: {aircraft.length}</div>
      </div>
      <DataTable data={aircraft} emptyMessage="Нет ВС" onRowClick={onEdit}
        columns={[
          { key: 'registrationNumber', header: 'Регистрация', render: (a) => <span className="font-medium text-primary-500">{a.registrationNumber}</span> },
          { key: 'aircraftType', header: 'Тип' },
          { key: 'flightHours', header: 'Налёт (ч)', render: (a) => <span className="font-mono">{a.flightHours?.toLocaleString() || '—'}</span> },
          { key: 'status', header: 'Статус', render: (a) => <StatusBadge status={a.status} /> },
        ]} />
    </Modal>
  );
}
