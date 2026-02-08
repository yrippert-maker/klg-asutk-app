'use client';

import { useState, useEffect } from 'react';

interface Risk {
  id: string;
  title: string;
  level: 'Низкий' | 'Средний' | 'Высокий' | 'Критический';
  category: string;
  aircraft: string;
  status: string;
  date: string;
  description?: string;
  impact?: string;
  probability?: string;
  mitigation?: string;
  responsible?: string;
  deadline?: string;
}

interface RiskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: Risk | null;
  onSave?: (updatedRisk: Risk) => void;
}

export default function RiskDetailsModal({ isOpen, onClose, risk, onSave }: RiskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRisk, setEditedRisk] = useState<Risk | null>(null);

  useEffect(() => {
    if (risk) {
      setEditedRisk({ ...risk });
      setIsEditing(false);
    }
  }, [risk]);

  if (!isOpen || !risk || !editedRisk) {
    return null;
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Критический': return '#f44336';
      case 'Высокий': return '#ff9800';
      case 'Средний': return '#ffc107';
      case 'Низкий': return '#4caf50';
      default: return '#666';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'Критический': return '#ffebee';
      case 'Высокий': return '#fff3e0';
      case 'Средний': return '#fffde7';
      case 'Низкий': return '#e8f5e9';
      default: return '#f5f5f5';
    }
  };

  const handleChange = (field: keyof Risk, value: string) => {
    if (editedRisk) {
      setEditedRisk({ ...editedRisk, [field]: value });
    }
  };

  const handleSave = () => {
    if (editedRisk && onSave) {
      onSave(editedRisk);
      setIsEditing(false);
      alert('Риск успешно обновлён');
    }
  };

  const handleCancel = () => {
    if (risk) {
      setEditedRisk({ ...risk });
      setIsEditing(false);
    }
  };

  const currentRisk = isEditing ? editedRisk : risk;

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
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Название риска:
                </label>
                <input
                  type="text"
                  value={editedRisk?.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  {currentRisk.title}
                </h2>
                <span
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: getLevelColor(currentRisk.level),
                    color: 'white',
                  }}
                >
                  {currentRisk.level}
                </span>
              </div>
            )}
            <div style={{ fontSize: '14px', color: '#666' }}>
              {isEditing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Категория:</label>
                    <input
                      type="text"
                      value={editedRisk?.category || ''}
                      onChange={(e) => handleChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>ВС:</label>
                    <input
                      type="text"
                      value={editedRisk?.aircraft || ''}
                      onChange={(e) => handleChange('aircraft', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              ) : (
                `Категория: ${currentRisk.category} | ВС: ${currentRisk.aircraft}`
              )}
            </div>
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

        <div
          style={{
            backgroundColor: getLevelBgColor(currentRisk.level),
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            borderLeft: `4px solid ${getLevelColor(currentRisk.level)}`,
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
            Общая информация
          </div>
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>Статус:</label>
                <select
                  value={editedRisk?.status || ''}
                  onChange={(e) => handleChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="Требует внимания">Требует внимания</option>
                  <option value="В работе">В работе</option>
                  <option value="Устранён">Устранён</option>
                  <option value="Отложен">Отложен</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>Дата выявления:</label>
                <input
                  type="date"
                  value={editedRisk?.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>Уровень риска:</label>
                <select
                  value={editedRisk?.level || ''}
                  onChange={(e) => handleChange('level', e.target.value as Risk['level'])}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="Низкий">Низкий</option>
                  <option value="Средний">Средний</option>
                  <option value="Высокий">Высокий</option>
                  <option value="Критический">Критический</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>Ответственный:</label>
                <input
                  type="text"
                  value={editedRisk?.responsible || ''}
                  onChange={(e) => handleChange('responsible', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>Срок устранения:</label>
                <input
                  type="date"
                  value={editedRisk?.deadline || ''}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                <div style={{ color: '#666', marginBottom: '4px' }}>Статус:</div>
                <div style={{ fontWeight: '500' }}>{currentRisk.status}</div>
              </div>
              <div>
                <div style={{ color: '#666', marginBottom: '4px' }}>Дата выявления:</div>
                <div style={{ fontWeight: '500' }}>{currentRisk.date}</div>
              </div>
              {currentRisk.responsible && (
                <div>
                  <div style={{ color: '#666', marginBottom: '4px' }}>Ответственный:</div>
                  <div style={{ fontWeight: '500' }}>{currentRisk.responsible}</div>
                </div>
              )}
              {currentRisk.deadline && (
                <div>
                  <div style={{ color: '#666', marginBottom: '4px' }}>Срок устранения:</div>
                  <div style={{ fontWeight: '500' }}>{currentRisk.deadline}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            Описание риска
          </h3>
          {isEditing ? (
            <textarea
              value={editedRisk?.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Введите описание риска..."
            />
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              minHeight: '60px',
            }}>
              {currentRisk.description || 'Описание не указано'}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Влияние
            </h3>
            {isEditing ? (
              <textarea
                value={editedRisk?.impact || ''}
                onChange={(e) => handleChange('impact', e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Опишите влияние риска..."
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
                {currentRisk.impact || 'Не указано'}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Вероятность
            </h3>
            {isEditing ? (
              <textarea
                value={editedRisk?.probability || ''}
                onChange={(e) => handleChange('probability', e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Опишите вероятность риска..."
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
                {currentRisk.probability || 'Не указано'}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
            Меры по снижению риска
          </h3>
          {isEditing ? (
            <textarea
              value={editedRisk?.mitigation || ''}
              onChange={(e) => handleChange('mitigation', e.target.value)}
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Опишите меры по снижению риска..."
            />
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              minHeight: '80px',
            }}>
              {currentRisk.mitigation || 'Меры не указаны'}
            </div>
          )}
        </div>

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
