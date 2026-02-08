'use client';

import { useState, useEffect } from 'react';

interface Audit {
  id: string;
  number: string;
  type: string;
  status: string;
  organization: string;
  date: string;
  inspector: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  deadline?: string;
}

interface AuditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: Audit | null;
  onSave?: (updatedAudit: Audit) => void;
}

export default function AuditCardModal({ isOpen, onClose, audit, onSave }: AuditCardModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAudit, setEditedAudit] = useState<Audit | null>(null);

  useEffect(() => {
    if (audit) {
      setEditedAudit({ ...audit });
      setIsEditing(false);
    }
  }, [audit]);

  if (!isOpen || !audit || !editedAudit) {
    return null;
  }

  const handleChange = (field: keyof Audit, value: string) => {
    setEditedAudit({ ...editedAudit, [field]: value });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedAudit);
      setIsEditing(false);
      alert('Аудит успешно обновлён');
    }
  };

  const handleCancel = () => {
    if (audit) {
      setEditedAudit({ ...audit });
      setIsEditing(false);
    }
  };

  const currentAudit = isEditing ? editedAudit : audit;

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
      onClick={!isEditing ? onClose : undefined}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              {currentAudit.number}
            </h2>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Тип аудита:
                  </label>
                  <select
                    value={editedAudit.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="Плановый аудит">Плановый аудит</option>
                    <option value="Внеплановый аудит">Внеплановый аудит</option>
                    <option value="Внезапный аудит">Внезапный аудит</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Организация:
                    </label>
                    <input
                      type="text"
                      value={editedAudit.organization}
                      onChange={(e) => handleChange('organization', e.target.value)}
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
                      Инспектор:
                    </label>
                    <input
                      type="text"
                      value={editedAudit.inspector}
                      onChange={(e) => handleChange('inspector', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Дата:
                    </label>
                    <input
                      type="date"
                      value={editedAudit.date}
                      onChange={(e) => handleChange('date', e.target.value)}
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
                      Статус:
                    </label>
                    <select
                      value={editedAudit.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="Запланирован">Запланирован</option>
                      <option value="В процессе">В процессе</option>
                      <option value="Завершён">Завершён</option>
                      <option value="Отменён">Отменён</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#666' }}>
                Тип: {currentAudit.type} | Организация: {currentAudit.organization} | Инспектор: {currentAudit.inspector} | Дата: {currentAudit.date}
              </div>
            )}
          </div>
          {!isEditing && (
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
          )}
        </div>

        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
            Статус: <span style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: currentAudit.status === 'В процессе' ? '#ff9800' : '#2196f3',
              color: 'white',
            }}>{currentAudit.status}</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            Описание аудита
          </h3>
          {isEditing ? (
            <textarea
              value={editedAudit.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
              placeholder="Введите описание аудита..."
            />
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.6',
              minHeight: '60px',
            }}>
              {currentAudit.description || 'Описание не указано'}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Выявленные нарушения
            </h3>
            {isEditing ? (
              <textarea
                value={editedAudit.findings || ''}
                onChange={(e) => handleChange('findings', e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
                placeholder="Опишите выявленные нарушения..."
              />
            ) : (
              <div style={{
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                minHeight: '100px',
              }}>
                {currentAudit.findings || 'Нарушения не выявлены'}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Рекомендации
            </h3>
            {isEditing ? (
              <textarea
                value={editedAudit.recommendations || ''}
                onChange={(e) => handleChange('recommendations', e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
                placeholder="Опишите рекомендации..."
              />
            ) : (
              <div style={{
                padding: '16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                minHeight: '100px',
              }}>
                {currentAudit.recommendations || 'Рекомендации не указаны'}
              </div>
            )}
          </div>
        </div>

        {currentAudit.deadline && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Срок устранения: {currentAudit.deadline}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
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
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Сохранить
              </button>
            </>
          ) : (
            <>
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
                Закрыть
              </button>
              <button
                onClick={() => setIsEditing(true)}
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
                Редактировать
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
