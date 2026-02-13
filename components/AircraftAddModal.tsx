'use client';

import { useState, useRef } from 'react';

export interface AircraftFormData {
  registrationNumber: string;
  serialNumber: string;
  aircraftType: string;
  model: string;
  operator: string;
  status: string;
  manufacturer?: string;
  yearOfManufacture?: string;
  flightHours?: string;
}

interface AircraftAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AircraftFormData, files: File[]) => void | Promise<void>;
}

export default function AircraftAddModal({ isOpen, onClose, onSave }: AircraftAddModalProps) {
  const [formData, setFormData] = useState<AircraftFormData>({
    registrationNumber: '',
    serialNumber: '',
    aircraftType: 'Boeing 737-800',
    model: '737-800',
    operator: '',
    status: 'active',
    manufacturer: '',
    yearOfManufacture: '',
    flightHours: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field: keyof AircraftFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleSubmit = async () => {
    if (!formData.registrationNumber || !formData.serialNumber || !formData.operator) {
      alert('Заполните обязательные поля: регистрационный номер, серийный номер, оператор');
      return;
    }

    await onSave(formData, files);
    setFormData({
      registrationNumber: '',
      serialNumber: '',
      aircraftType: 'Boeing 737-800',
      model: '737-800',
      operator: '',
      status: 'active',
      manufacturer: '',
      yearOfManufacture: '',
      flightHours: '',
    });
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' };
  const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>Добавить воздушное судно</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Регистрационный номер *</label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
              placeholder="RA-73701"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Серийный номер *</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
              placeholder="MSN-4521"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Тип ВС</label>
            <select
              value={formData.aircraftType}
              onChange={(e) => handleChange('aircraftType', e.target.value)}
              style={inputStyle}
            >
              <option value="Boeing 737-800">Boeing 737-800</option>
              <option value="Sukhoi Superjet 100">Sukhoi Superjet 100</option>
              <option value="An-148-100V">An-148-100V</option>
              <option value="Il-76TD-90VD">Il-76TD-90VD</option>
              <option value="Mi-8MTV-1">Mi-8MTV-1</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Оператор *</label>
            <input
              type="text"
              value={formData.operator}
              onChange={(e) => handleChange('operator', e.target.value)}
              placeholder="REFLY Airlines"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Статус</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              style={inputStyle}
            >
              <option value="active">Активен</option>
              <option value="maintenance">На ТО</option>
              <option value="storage">На хранении</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Прикрепить файлы</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              style={inputStyle}
            />
            {files.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                Выбрано файлов: {files.length}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
