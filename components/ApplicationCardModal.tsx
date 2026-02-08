'use client';

import { useState, useEffect } from 'react';

interface Application {
  id: string;
  number: string;
  type: string;
  status: string;
  aircraft: string;
  date: string;
  organization: string;
  description?: string;
  documents?: string[];
  comments?: string;
}

interface ApplicationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onSave?: (updatedApplication: Application) => void;
}

export default function ApplicationCardModal({ isOpen, onClose, application, onSave }: ApplicationCardModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedApplication, setEditedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (application) {
      setEditedApplication({ ...application });
      setIsEditing(false);
    }
  }, [application]);

  if (!isOpen || !application || !editedApplication) {
    return null;
  }

  const handleChange = (field: keyof Application, value: string | string[]) => {
    setEditedApplication({ ...editedApplication, [field]: value });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedApplication);
      setIsEditing(false);
      alert('Заявка успешно обновлена');
    }
  };

  const handleCancel = () => {
    if (application) {
      setEditedApplication({ ...application });
      setIsEditing(false);
    }
  };

  const currentApplication = isEditing ? editedApplication : application;

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
              {currentApplication.number}
            </h2>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Тип заявки:
                  </label>
                  <select
                    value={editedApplication.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="Регистрация ВС">Регистрация ВС</option>
                    <option value="Сертификация">Сертификация</option>
                    <option value="Изменение регистрации">Изменение регистрации</option>
                    <option value="Снятие с учёта">Снятие с учёта</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      ВС:
                    </label>
                    <input
                      type="text"
                      value={editedApplication.aircraft}
                      onChange={(e) => handleChange('aircraft', e.target.value)}
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
                      Организация:
                    </label>
                    <input
                      type="text"
                      value={editedApplication.organization}
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
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Дата:
                    </label>
                    <input
                      type="date"
                      value={editedApplication.date}
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
                      value={editedApplication.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="В обработке">В обработке</option>
                      <option value="На рассмотрении">На рассмотрении</option>
                      <option value="Одобрена">Одобрена</option>
                      <option value="Отклонена">Отклонена</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#666' }}>
                Тип: {currentApplication.type} | ВС: {currentApplication.aircraft} | Организация: {currentApplication.organization} | Дата: {currentApplication.date}
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
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            Статус: <span style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: currentApplication.status === 'Одобрена' ? '#4caf50' : currentApplication.status === 'Отклонена' ? '#f44336' : '#ff9800',
              color: 'white',
            }}>{currentApplication.status}</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            Описание заявки
          </h3>
          {isEditing ? (
            <textarea
              value={editedApplication.description || ''}
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
              placeholder="Введите описание заявки..."
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
              {currentApplication.description || 'Описание не указано'}
            </div>
          )}
        </div>

        {currentApplication.comments && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Комментарии
            </h3>
            {isEditing ? (
              <textarea
                value={editedApplication.comments || ''}
                onChange={(e) => handleChange('comments', e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
                placeholder="Введите комментарии..."
              />
            ) : (
              <div style={{
                padding: '16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}>
                {currentApplication.comments}
              </div>
            )}
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
