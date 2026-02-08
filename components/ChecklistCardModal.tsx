'use client';

import { useState, useEffect } from 'react';

interface Checklist {
  id: string;
  name: string;
  type: string;
  status: string;
  aircraft: string;
  date: string;
  items: number;
  completed: number;
  description?: string;
  checklistItems?: Array<{ id: string; text: string; checked: boolean }>;
  standards?: { icao?: boolean; easa?: boolean; faa?: boolean; armak?: boolean };
  inspector?: string;
  inspectorLicense?: string;
  operator?: string;
  checklistNumber?: string;
}

interface ChecklistCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: Checklist | null;
  onSave?: (updatedChecklist: Checklist) => void;
}

export default function ChecklistCardModal({ isOpen, onClose, checklist, onSave }: ChecklistCardModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedChecklist, setEditedChecklist] = useState<Checklist | null>(null);

  useEffect(() => {
    if (checklist) {
      setEditedChecklist({ ...checklist });
      setIsEditing(false);
    }
  }, [checklist]);

  if (!isOpen || !checklist || !editedChecklist) {
    return null;
  }

  const handleChange = (field: keyof Checklist, value: string | number) => {
    setEditedChecklist({ ...editedChecklist, [field]: value });
  };

  const handleItemToggle = (itemId: string) => {
    if (editedChecklist.checklistItems) {
      const updatedItems = editedChecklist.checklistItems.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      const completed = updatedItems.filter(item => item.checked).length;
      setEditedChecklist({
        ...editedChecklist,
        checklistItems: updatedItems,
        completed,
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedChecklist);
      setIsEditing(false);
      alert('Чек-лист успешно обновлён');
    }
  };

  const handleCancel = () => {
    if (checklist) {
      setEditedChecklist({ ...checklist });
      setIsEditing(false);
    }
  };

  const currentChecklist = isEditing ? editedChecklist : checklist;
  const progress = currentChecklist.items > 0 
    ? Math.round((currentChecklist.completed / currentChecklist.items) * 100) 
    : 0;

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
            {isEditing ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Название чек-листа:
                </label>
                <input
                  type="text"
                  value={editedChecklist.name}
                  onChange={(e) => handleChange('name', e.target.value)}
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
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {currentChecklist.name}
                </h2>
                {currentChecklist.checklistNumber && (
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    Номер: {currentChecklist.checklistNumber}
                  </div>
                )}
                {/* Отображение стандартов соответствия */}
                {currentChecklist.standards && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {currentChecklist.standards.icao && (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}>
                        ICAO
                      </span>
                    )}
                    {currentChecklist.standards.easa && (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#fff3e0',
                        color: '#e65100',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}>
                        EASA
                      </span>
                    )}
                    {currentChecklist.standards.faa && (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#f3e5f5',
                        color: '#7b1fa2',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}>
                        FAA
                      </span>
                    )}
                    {currentChecklist.standards.armak && (
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}>
                        АРМАК
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{ fontSize: '14px', color: '#666' }}>
              {isEditing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Тип:</label>
                    <select
                      value={editedChecklist.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="Ежедневный">Ежедневный</option>
                      <option value="Периодический">Периодический</option>
                      <option value="Предполётный">Предполётный</option>
                      <option value="Послеполётный">Послеполётный</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>ВС:</label>
                    <input
                      type="text"
                      value={editedChecklist.aircraft}
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
                <div>
                  <div style={{ marginBottom: '4px' }}>
                    Тип: {currentChecklist.type} | ВС: {currentChecklist.aircraft} | Дата: {currentChecklist.date}
                  </div>
                  {currentChecklist.operator && (
                    <div style={{ marginBottom: '4px' }}>
                      Оператор: {currentChecklist.operator}
                    </div>
                  )}
                  {currentChecklist.inspector && (
                    <div style={{ marginBottom: '4px' }}>
                      Инспектор: {currentChecklist.inspector}
                      {currentChecklist.inspectorLicense && ` (${currentChecklist.inspectorLicense})`}
                    </div>
                  )}
                </div>
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

        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px' }}>
            Прогресс выполнения: {currentChecklist.completed} / {currentChecklist.items} ({progress}%)
          </div>
          <div style={{
            width: '100%',
            height: '24px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: currentChecklist.status === 'Завершён' ? '#4caf50' : '#1e3a5f',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            Статус: <span style={{
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: currentChecklist.status === 'Завершён' ? '#4caf50' : '#ff9800',
              color: 'white',
            }}>{currentChecklist.status}</span>
          </div>
        </div>

        {currentChecklist.description && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Описание
            </h3>
            {isEditing ? (
              <textarea
                value={editedChecklist.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <div style={{
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.6',
              }}>
                {currentChecklist.description}
              </div>
            )}
          </div>
        )}

        {currentChecklist.checklistItems && currentChecklist.checklistItems.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Пункты чек-листа
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentChecklist.checklistItems.map((item) => {
                // Парсим текст для извлечения категории и требования
                const categoryMatch = item.text.match(/\[([^\]]+)\]/);
                const requirementMatch = item.text.match(/\(([^)]+)\)/);
                const category = categoryMatch ? categoryMatch[1] : '';
                const requirement = requirementMatch ? requirementMatch[1] : '';
                const itemText = item.text.replace(/\[([^\]]+)\]\s*/, '').replace(/\s*\(([^)]+)\)/, '');
                
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      backgroundColor: item.checked ? '#e8f5e9' : '#f5f5f5',
                      borderRadius: '4px',
                      border: item.checked ? '1px solid #4caf50' : '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleItemToggle(item.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '18px', color: item.checked ? '#4caf50' : '#999' }}>
                        {item.checked ? '✓' : '○'}
                      </span>
                    )}
                    <div style={{ flex: 1 }}>
                      {category && (
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>
                          {category} {requirement && `• ${requirement}`}
                        </div>
                      )}
                      <span style={{
                        textDecoration: item.checked ? 'line-through' : 'none',
                        opacity: item.checked ? 0.6 : 1,
                        fontSize: '14px',
                      }}>
                        {itemText || item.text}
                      </span>
                    </div>
                  </div>
                );
              })}
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
