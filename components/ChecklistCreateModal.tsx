'use client';

import { useState } from 'react';
import { 
  createICAOChecklist, 
  createEASAChecklist, 
  createFAAChecklist, 
  createARMACChecklist,
  createUniversalChecklist,
  ICAOCategories,
  EASACategories,
  FAACategories,
  ARMACCategories,
  type ComplianceChecklist 
} from '@/lib/compliance/checklist-formats';

interface ChecklistCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (checklist: {
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
  }) => void;
}

export default function ChecklistCreateModal({ isOpen, onClose, onCreate }: ChecklistCreateModalProps) {
  const [standard, setStandard] = useState<'icao' | 'easa' | 'faa' | 'armak' | 'universal'>('universal');
  const [formData, setFormData] = useState({
    name: '',
    type: 'pre-flight' as 'pre-flight' | 'post-flight' | 'maintenance' | 'annual' | 'special',
    status: 'В процессе',
    aircraft: '',
    aircraftType: '',
    operator: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    inspector: '',
    inspectorLicense: '',
    items: [] as Array<{ id: string; category: string; text: string; requirement: string; checked: boolean; status: 'compliant' | 'non-compliant' | 'not-applicable' | 'pending' }>,
  });

  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemRequirement, setNewItemRequirement] = useState('');

  // Получаем категории в зависимости от выбранного стандарта
  const getCategories = () => {
    switch (standard) {
      case 'easa':
        return EASACategories;
      case 'faa':
        return FAACategories;
      case 'armak':
        return ARMACCategories;
      case 'icao':
      default:
        return ICAOCategories;
    }
  };

  const categories = getCategories();

  if (!isOpen) {
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddItem = () => {
    if (newItemText.trim() && newItemCategory) {
      setFormData({
        ...formData,
        items: [...formData.items, {
          id: `item-${Date.now()}`,
          category: newItemCategory,
          text: newItemText.trim(),
          requirement: newItemRequirement.trim() || 'Не указано',
          checked: false,
          status: 'pending' as const,
        }],
      });
      setNewItemText('');
      setNewItemCategory('');
      setNewItemRequirement('');
    }
  };

  const handleAddStandardItems = (category: string, items: string[]) => {
    const newItems = items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      category,
      text: item,
      requirement: standard === 'easa' ? 'EASA Part-M' : 
                   standard === 'faa' ? 'FAA Part 91/135' : 
                   standard === 'armak' ? 'АРМАК / ФАП' : 
                   'ICAO Annex 6',
      checked: false,
      status: 'pending' as const,
    }));
    setFormData({
      ...formData,
      items: [...formData.items, ...newItems],
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId),
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.aircraft || !formData.inspector) {
      alert('Пожалуйста, заполните все обязательные поля (Название, ВС, Инспектор)');
      return;
    }

    // Создаем чек-лист согласно выбранному стандарту
    const standards = {
      icao: standard === 'icao' || standard === 'universal',
      easa: standard === 'easa' || standard === 'universal',
      faa: standard === 'faa' || standard === 'universal',
      armak: standard === 'armak' || standard === 'universal',
    };

    const checklistData = {
      aircraftRegistration: formData.aircraft,
      aircraftType: formData.aircraftType,
      operator: formData.operator,
      date: formData.date,
      inspector: formData.inspector,
      inspectorLicense: formData.inspectorLicense,
      checklistType: formData.type,
      items: formData.items.map(item => ({
        id: item.id,
        category: item.category,
        item: item.text,
        requirement: item.requirement,
        status: item.status,
        notes: item.checked ? 'Выполнено' : undefined,
      })),
    };

    // Создаем compliance checklist для будущего использования
    // (пока не используется, но может быть полезен для экспорта/сохранения)
    const getComplianceChecklist = (): ComplianceChecklist => {
      switch (standard) {
        case 'easa':
          return createEASAChecklist(checklistData);
        case 'faa':
          return createFAAChecklist(checklistData);
        case 'armak':
          return createARMACChecklist(checklistData);
        case 'icao':
          return createICAOChecklist(checklistData);
        default:
          return createUniversalChecklist(checklistData);
      }
    };
    
    // Вызываем функцию для создания compliance checklist (может быть использован в будущем)
    getComplianceChecklist();

    if (onCreate) {
      onCreate({
        name: formData.name,
        type: formData.type === 'pre-flight' ? 'Предполётный' : 
              formData.type === 'post-flight' ? 'Послеполётный' : 
              formData.type === 'maintenance' ? 'Техническое обслуживание' : 
              formData.type === 'annual' ? 'Годовой' : 'Специальный',
        status: formData.status,
        aircraft: formData.aircraft,
        date: formData.date,
        items: formData.items.length,
        completed: formData.items.filter(i => i.checked).length,
        description: formData.description,
        checklistItems: formData.items.map(item => ({
          id: item.id,
          text: `[${item.category}] ${item.text} (${item.requirement})`,
          checked: item.checked,
        })),
        standards,
        inspector: formData.inspector,
        inspectorLicense: formData.inspectorLicense,
        operator: formData.operator,
      });
      setFormData({
        name: '',
        type: 'pre-flight',
        status: 'В процессе',
        aircraft: '',
        aircraftType: '',
        operator: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        inspector: '',
        inspectorLicense: '',
        items: [],
      });
      setNewItemText('');
      setNewItemCategory('');
      setNewItemRequirement('');
      setStandard('universal');
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
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Создание чек-листа</h2>
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
              Стандарт соответствия <span style={{ color: 'red' }}>*</span>:
            </label>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value as any)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="universal">Универсальный (EASA, FAA, АРМАК, ICAO)</option>
              <option value="easa">EASA Part-M</option>
              <option value="faa">FAA Part 91/135</option>
              <option value="armak">АРМАК</option>
              <option value="icao">ICAO Annex 6</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Название чек-листа <span style={{ color: 'red' }}>*</span>:
            </label>
            <input
              type="text"
              value={formData.name}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Тип чек-листа:
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="pre-flight">Предполётный</option>
                <option value="post-flight">Послеполётный</option>
                <option value="maintenance">Техническое обслуживание</option>
                <option value="annual">Годовой</option>
                <option value="special">Специальный</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Регистрационный номер ВС <span style={{ color: 'red' }}>*</span>:
              </label>
              <input
                type="text"
                value={formData.aircraft}
                onChange={(e) => handleChange('aircraft', e.target.value)}
                placeholder="RA-12345"
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
                Тип ВС:
              </label>
              <input
                type="text"
                value={formData.aircraftType}
                onChange={(e) => handleChange('aircraftType', e.target.value)}
                placeholder="Boeing 737-800"
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
                Оператор:
              </label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => handleChange('operator', e.target.value)}
                placeholder="Аэрофлот"
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
                Инспектор <span style={{ color: 'red' }}>*</span>:
              </label>
              <input
                type="text"
                value={formData.inspector}
                onChange={(e) => handleChange('inspector', e.target.value)}
                placeholder="Иванов И.И."
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
                Лицензия инспектора:
              </label>
              <input
                type="text"
                value={formData.inspectorLicense}
                onChange={(e) => handleChange('inspectorLicense', e.target.value)}
                placeholder="LIC-12345"
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
                value={formData.date}
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
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="В процессе">В процессе</option>
                <option value="Завершён">Завершён</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Описание:
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Пункты чек-листа:
            </label>
            
            {/* Быстрое добавление стандартных категорий */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#666' }}>
                Быстрое добавление стандартных категорий:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(categories).map(([category, items]) => (
                  <button
                    key={category}
                    onClick={() => handleAddStandardItems(category, items)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      border: '1px solid #1976d2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    + {category} ({items.length})
                  </button>
                ))}
              </div>
            </div>

            {/* Ручное добавление пунктов */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Выберите категорию</option>
                  {Object.keys(categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newItemRequirement}
                  onChange={(e) => setNewItemRequirement(e.target.value)}
                  placeholder="Требование (EASA Part-M, FAA Part 91, АРМАК...)"
                  style={{
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  placeholder="Введите пункт чек-листа..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newItemText.trim() || !newItemCategory}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: (!newItemText.trim() || !newItemCategory) ? '#ccc' : '#1e3a5f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!newItemText.trim() || !newItemCategory) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Добавить
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {formData.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      [{item.category}] {item.requirement}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.text}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.items.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                  Нет пунктов. Используйте кнопки выше для быстрого добавления или добавьте вручную.
                </div>
              )}
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
            onClick={handleSubmit}
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
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}
