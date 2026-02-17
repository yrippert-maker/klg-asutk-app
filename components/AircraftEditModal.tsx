'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  aircraft: any;
  onSave: (id: string, data: any) => void;
}

export default function AircraftEditModal({ isOpen, onClose, aircraft, onSave }: Props) {
  const [form, setForm] = useState({
    registration_number: '',
    serial_number: '',
    aircraft_type: '',
    model: '',
    operator_id: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (aircraft) {
      const t = aircraft?.aircraft_type;
      const typeStr = t ? [t.manufacturer, t.model].filter(Boolean).join(' ') || t.icao_code || '' : '';
      setForm({
        registration_number: aircraft.registration_number ?? aircraft.registrationNumber ?? '',
        serial_number: aircraft.serial_number ?? '',
        aircraft_type: typeStr || aircraft.aircraft_type ?? '',
        model: aircraft.model ?? '',
        operator_id: aircraft.operator_id ?? aircraft.operator ?? '',
      });
    }
  }, [aircraft]);

  const handleSave = () => {
    if (!form.registration_number.trim()) return alert('Укажите регистрацию');
    if (!aircraft?.id) return;
    onSave(aircraft.id, form);
    onClose();
  };

  if (!aircraft) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактировать ВС"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Отмена</button>
          <button onClick={handleSave} className="btn-primary">Сохранить</button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Регистрация" required>
          <input value={form.registration_number} onChange={e => set('registration_number', e.target.value)} className="input-field" placeholder="RA-XXXXX" />
        </FormField>
        <FormField label="Серийный номер">
          <input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} className="input-field" />
        </FormField>
        <FormField label="Тип ВС">
          <input value={form.aircraft_type} onChange={e => set('aircraft_type', e.target.value)} className="input-field" placeholder="Boeing 737-800, SSJ-100" />
        </FormField>
        <FormField label="Модель">
          <input value={form.model} onChange={e => set('model', e.target.value)} className="input-field" />
        </FormField>
        <FormField label="Оператор (ID или название)">
          <input value={form.operator_id} onChange={e => set('operator_id', e.target.value)} className="input-field" placeholder="Оператор" />
        </FormField>
      </div>
    </Modal>
  );
}
