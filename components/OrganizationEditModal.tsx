'use client';

import { useState, useEffect } from 'react';

interface Organization {
  name: string;
  type?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
}

interface OrganizationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onSave?: (updatedOrganization: Organization) => void;
}

export default function OrganizationEditModal({ isOpen, onClose, organization, onSave }: OrganizationEditModalProps) {
  const [editedOrganization, setEditedOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (organization) {
      setEditedOrganization({ ...organization });
    }
  }, [organization]);

  if (!isOpen || !organization || !editedOrganization) {
    return null;
  }

  const handleChange = (field: keyof Organization, value: string) => {
    setEditedOrganization({ ...editedOrganization, [field]: value });
  };

  const handleSave = () => {
    if (!editedOrganization.name) {
      alert('Пожалуйста, укажите название организации');
      return;
    }

    if (onSave) {
      onSave(editedOrganization);
      alert('Организация успешно обновлена');
      onClose();
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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Редактирование организации</h2>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Название организации <span style={{ color: 'red' }}>*</span>:
            </label>
            <input
              type="text"
              value={editedOrganization.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Тип организации:
            </label>
            <select
              value={editedOrganization.type || 'Авиакомпания'}
              onChange={(e) => handleChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="Авиакомпания">Авиакомпания</option>
              <option value="Аэропорт">Аэропорт</option>
              <option value="Сервисная организация">Сервисная организация</option>
              <option value="Производитель">Производитель</option>
              <option value="Другое">Другое</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Адрес:
            </label>
            <input
              type="text"
              value={editedOrganization.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              placeholder="Введите адрес организации"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Контактное лицо:
            </label>
            <input
              type="text"
              value={editedOrganization.contact || ''}
              onChange={(e) => handleChange('contact', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              placeholder="Введите ФИО контактного лица"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Email:
              </label>
              <input
                type="email"
                value={editedOrganization.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Телефон:
              </label>
              <input
                type="tel"
                value={editedOrganization.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
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
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
