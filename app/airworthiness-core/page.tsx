'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AirworthinessCoreView, { TABS, type Tab, type ControlRecord } from '@/components/AirworthinessCoreView';

const DEMO_CONTROL: ControlRecord[] = [
  { id: '1', registration: 'RA-73001', aircraft_type: 'SSJ-100', last_check_date: '2024-11-15', status: 'Годен', valid_until: '2025-11-15', responsible: 'Иванов И.И.', history: [{ date: '2024-11-15', type: 'Периодический осмотр', result: 'Годен' }, { date: '2023-11-10', type: 'Периодический осмотр', result: 'Годен' }] },
  { id: '2', registration: 'RA-73002', aircraft_type: 'MC-21', last_check_date: '2024-10-20', status: 'Годен', valid_until: '2025-10-20', responsible: 'Петров П.П.' },
  { id: '3', registration: 'RA-73003', aircraft_type: 'Ан-148', last_check_date: '2024-09-05', status: 'Ограниченно годен', valid_until: '2025-01-05', responsible: 'Сидорова А.С.', notes: 'Ограничение по наработке двигателя' },
  { id: '4', registration: 'VQ-BAB', aircraft_type: 'Boeing 737-800', last_check_date: '2024-12-01', status: 'Годен', valid_until: '2025-12-01', responsible: 'Козлов М.А.' },
  { id: '5', registration: 'RA-73005', aircraft_type: 'Airbus A320', last_check_date: '2024-08-12', status: 'Годен', valid_until: '2025-08-12', responsible: 'Новикова Е.В.' },
  { id: '6', registration: 'RA-73006', aircraft_type: 'SSJ-100', last_check_date: '2024-11-28', status: 'Годен', valid_until: '2025-11-28', responsible: 'Иванов И.И.' },
  { id: '7', registration: 'RA-73007', aircraft_type: 'MC-21', last_check_date: '2024-10-10', status: 'На проверке', valid_until: '—', responsible: 'Петров П.П.' },
];

export default function AirworthinessCorePage() {
  const [tab, setTab] = useState<Tab>('control');
  const [data, setData] = useState<Record<string, { items?: unknown[] }>>({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [controlRecords, setControlRecords] = useState<ControlRecord[]>(DEMO_CONTROL);
  const [selectedControl, setSelectedControl] = useState<ControlRecord | null>(null);
  const [controlFilter, setControlFilter] = useState('');
  const [controlSort, setControlSort] = useState<'registration' | 'last_check_date' | 'status'>('registration');

  const api = useCallback(async (endpoint: string, opts?: RequestInit) => {
    const res = await fetch(`/api/v1/airworthiness-core/${endpoint}`, opts);
    return res.json();
  }, []);

  useEffect(() => {
    if (tab === 'control') { setLoading(false); return; }
    setLoading(true);
    const endpoint = tab === 'life-limits' ? 'life-limits' : tab === 'maint-programs' ? 'maintenance-programs' : tab;
    api(endpoint).then(d => { setData(prev => ({ ...prev, [tab]: d })); setLoading(false); });
  }, [tab, api]);

  const currentTab = TABS.find(t => t.id === tab) ?? TABS[0];
  const items = tab === 'control' ? [] : (data[tab]?.items || []);

  const filteredControl = controlRecords
    .filter(r => !controlFilter || r.registration.toLowerCase().includes(controlFilter.toLowerCase()) || r.aircraft_type.toLowerCase().includes(controlFilter.toLowerCase()) || r.status.toLowerCase().includes(controlFilter.toLowerCase()))
    .sort((a, b) => {
      const va = a[controlSort], vb = b[controlSort];
      return String(va).localeCompare(String(vb), undefined, { numeric: true });
    });

  const downloadCertificate = (r: ControlRecord) => {
    const text = [
      'СЕРТИФИКАТ ЛЁТНОЙ ГОДНОСТИ (выписка)',
      `Бортовой номер: ${r.registration}`,
      `Тип ВС: ${r.aircraft_type}`,
      `Дата последней проверки: ${r.last_check_date}`,
      `Статус ЛГ: ${r.status}`,
      `Срок действия: ${r.valid_until}`,
      `Ответственный: ${r.responsible}`,
      r.notes ? `Примечания: ${r.notes}` : '',
      '',
      'Документ сформирован системой КЛГ АСУ ТК. REFLY.',
    ].filter(Boolean).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `certificate_${r.registration}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return React.createElement(AirworthinessCoreView, {
    tab,
    setTab,
    loading,
    setShowAddModal,
    controlFilter,
    setControlFilter,
    controlSort,
    setControlSort,
    filteredControl,
    setSelectedControl,
    items,
    currentTab,
    selectedControl,
    downloadCertificate,
  });
}
