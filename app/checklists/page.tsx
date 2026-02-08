'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChecklistCardModal from '@/components/ChecklistCardModal';
import ChecklistCreateModal from '@/components/ChecklistCreateModal';
import Logo from '@/components/Logo';

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

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([
    {
      id: '1',
      name: 'Предполётный осмотр',
      type: 'Ежедневный',
      status: 'В процессе',
      aircraft: 'RA-12345',
      date: '2025-01-21',
      items: 25,
      completed: 18,
    },
    {
      id: '2',
      name: 'Техническое обслуживание',
      type: 'Периодический',
      status: 'Завершён',
      aircraft: 'RA-67890',
      date: '2025-01-20',
      items: 45,
      completed: 45,
      description: 'Периодическое техническое обслуживание воздушного судна RA-67890',
      checklistItems: [
        { id: '1', text: 'Проверка двигателя', checked: true },
        { id: '2', text: 'Проверка шасси', checked: true },
        { id: '3', text: 'Проверка системы навигации', checked: true },
      ],
    },
  ]);

  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpen = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setIsCardModalOpen(true);
  };

  const handleSaveChecklist = (updatedChecklist: Checklist) => {
    setChecklists(prev => prev.map(c => c.id === updatedChecklist.id ? updatedChecklist : c));
    setSelectedChecklist(updatedChecklist);
  };

  const handleCreateChecklist = (checklistData: any) => {
    const newChecklist: Checklist = {
      id: `checklist-${Date.now()}`,
      ...checklistData,
    };
    setChecklists(prev => [...prev, newChecklist]);
    alert('Чек-лист успешно создан');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
          <p style={{ fontSize: '16px', color: '#666', marginTop: '16px', marginBottom: '24px' }}>
            Система контроля лётной годности воздушных судов · Безопасность и качество
          </p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Чек-листы
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление чек-листами для проверки воздушных судов
            </p>
          </div>
          <div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
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
              Создать чек-лист
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {checklists.map(checklist => (
            <div key={checklist.id} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {checklist.name}
                  </div>
                  {checklist.checklistNumber && (
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      № {checklist.checklistNumber}
                    </div>
                  )}
                  {/* Отображение стандартов соответствия */}
                  {checklist.standards && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {checklist.standards.icao && (
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                        }}>
                          ICAO
                        </span>
                      )}
                      {checklist.standards.easa && (
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: '#fff3e0',
                          color: '#e65100',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                        }}>
                          EASA
                        </span>
                      )}
                      {checklist.standards.faa && (
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: '#f3e5f5',
                          color: '#7b1fa2',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                        }}>
                          FAA
                        </span>
                      )}
                      {checklist.standards.armak && (
                        <span style={{
                          padding: '3px 8px',
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                        }}>
                          АРМАК
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Тип: {checklist.type} | ВС: {checklist.aircraft}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Дата: {checklist.date}
                    {checklist.operator && ` | Оператор: ${checklist.operator}`}
                    {checklist.inspector && ` | Инспектор: ${checklist.inspector}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: checklist.status === 'Завершён' ? '#4caf50' : '#ff9800',
                    color: 'white',
                  }}>
                    {checklist.status}
                  </span>
                  <button
                    onClick={() => handleOpen(checklist)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1e3a5f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Открыть
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>Прогресс выполнения</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {checklist.completed} / {checklist.items}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '24px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(checklist.completed / checklist.items) * 100}%`,
                    height: '100%',
                    backgroundColor: checklist.status === 'Завершён' ? '#4caf50' : '#1e3a5f',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <ChecklistCardModal
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedChecklist(null);
          }}
          checklist={selectedChecklist}
          onSave={handleSaveChecklist}
        />

        <ChecklistCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateChecklist}
        />
      </div>
    </div>
  );
}
