'use client';

import { useState } from 'react';
import { Aircraft } from '@/lib/api';

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: string;
  aircraft: Aircraft[];
  onEdit?: (aircraft: Aircraft) => void;
}

export default function OrganizationDetailsModal({
  isOpen,
  onClose,
  organization,
  aircraft,
  onEdit,
}: OrganizationDetailsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAircraft, setEditedAircraft] = useState<Aircraft | null>(null);

  if (!isOpen) return null;

  const handleEdit = (item: Aircraft) => {
    setEditingId(item.id);
    setEditedAircraft({ ...item });
  };

  const handleSave = () => {
    if (editedAircraft && onEdit) {
      onEdit(editedAircraft);
    }
    setEditingId(null);
    setEditedAircraft(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedAircraft(null);
  };

  const handleChange = (field: keyof Aircraft, value: string | number) => {
    if (editedAircraft) {
      setEditedAircraft({ ...editedAircraft, [field]: value });
    }
  };

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
          padding: '32px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {organization}
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Воздушных судов: {aircraft.length}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  РЕГИСТРАЦИОННЫЙ НОМЕР
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  СЕРИЙНЫЙ НОМЕР
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  ТИП ВС
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  СТАТУС
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  НАЛЕТ (Ч)
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  ДЕЙСТВИЯ
                </th>
              </tr>
            </thead>
            <tbody>
              {aircraft.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px' }}>
                    {editingId === item.id && editedAircraft ? (
                      <input
                        type="text"
                        value={editedAircraft.registrationNumber}
                        onChange={(e) => handleChange('registrationNumber', e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          width: '100%',
                        }}
                      />
                    ) : (
                      item.registrationNumber
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingId === item.id && editedAircraft ? (
                      <input
                        type="text"
                        value={editedAircraft.serialNumber}
                        onChange={(e) => handleChange('serialNumber', e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          width: '100%',
                        }}
                      />
                    ) : (
                      item.serialNumber
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingId === item.id && editedAircraft ? (
                      <input
                        type="text"
                        value={editedAircraft.aircraftType}
                        onChange={(e) => handleChange('aircraftType', e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          width: '100%',
                        }}
                      />
                    ) : (
                      item.aircraftType
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingId === item.id && editedAircraft ? (
                      <select
                        value={editedAircraft.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          width: '100%',
                        }}
                      >
                        <option value="Активен">Активен</option>
                        <option value="На обслуживании">На обслуживании</option>
                        <option value="Неактивен">Неактивен</option>
                      </select>
                    ) : (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: item.status === 'Активен' ? '#4caf50' : '#ff9800',
                        color: 'white',
                      }}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingId === item.id && editedAircraft ? (
                      <input
                        type="number"
                        value={editedAircraft.flightHours}
                        onChange={(e) => handleChange('flightHours', parseInt(e.target.value) || 0)}
                        style={{
                          padding: '6px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          width: '100%',
                        }}
                      />
                    ) : (
                      item.flightHours
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editingId === item.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleSave}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancel}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e0e0e0',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1e3a5f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Редактировать
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
