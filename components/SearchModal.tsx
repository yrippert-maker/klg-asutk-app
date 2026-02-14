'use client';
import { useState, useMemo } from 'react';
import { Modal, DataTable, StatusBadge } from '@/components/ui';
import { Aircraft } from '@/lib/api/api-client';

interface Props { isOpen: boolean; onClose: () => void; aircraft: Aircraft[]; searchType?: string; }

export default function SearchModal({ isOpen, onClose, aircraft, searchType }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return aircraft;
    const q = query.toLowerCase();
    return aircraft.filter(a =>
      a.registrationNumber?.toLowerCase().includes(q) ||
      a.aircraftType?.toLowerCase().includes(q) ||
      a.operator?.toLowerCase().includes(q) ||
      a.serialNumber?.toLowerCase().includes(q)
    );
  }, [aircraft, query]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={searchType === 'organization' ? 'Поиск ВС организации' : 'Поиск воздушных судов'} size="lg">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по регистрации, типу, оператору..."
        className="input-field mb-4" autoFocus />
      <div className="text-sm text-gray-500 mb-3">Найдено: {filtered.length}</div>
      <DataTable data={filtered.slice(0, 50)} emptyMessage="Ничего не найдено"
        columns={[
          { key: 'registrationNumber', header: 'Регистрация', render: (a) => <span className="font-medium text-primary-500">{a.registrationNumber}</span> },
          { key: 'aircraftType', header: 'Тип' },
          { key: 'operator', header: 'Оператор' },
          { key: 'status', header: 'Статус', render: (a) => <StatusBadge status={a.status} /> },
        ]} />
    </Modal>
  );
}
