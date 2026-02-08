'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AuditCardModal from '@/components/AuditCardModal';
import AuditCreateModal from '@/components/AuditCreateModal';
import Logo from '@/components/Logo';

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

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([
    {
      id: '1',
      number: 'AUD-2025-001',
      type: 'Плановый аудит',
      status: 'Запланирован',
      organization: 'Аэрофлот',
      date: '2025-02-01',
      inspector: 'Иванов И.И.',
    },
    {
      id: '2',
      number: 'AUD-2025-002',
      type: 'Внеплановый аудит',
      status: 'В процессе',
      organization: 'S7 Airlines',
      date: '2025-01-21',
      inspector: 'Петров П.П.',
      description: 'Проведение внепланового аудита организации S7 Airlines для проверки соответствия требованиям безопасности.',
      findings: 'Выявлены незначительные нарушения в ведении документации.',
      recommendations: 'Рекомендуется обновить систему документооборота и провести обучение персонала.',
    },
  ]);

  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpen = (audit: Audit) => {
    setSelectedAudit(audit);
    setIsCardModalOpen(true);
  };

  const handleSaveAudit = (updatedAudit: Audit) => {
    setAudits(prev => prev.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    setSelectedAudit(updatedAudit);
  };

  const handleCreateAudit = (auditData: any) => {
    const newAudit: Audit = {
      id: `audit-${Date.now()}`,
      ...auditData,
    };
    setAudits(prev => [...prev, newAudit]);
    alert('Аудит успешно создан');
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
              Аудиты
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление аудитами и проверками воздушных судов
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
              Создать аудит
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            Все
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1e3a5f',
            border: '1px solid #1e3a5f',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            В процессе
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1e3a5f',
            border: '1px solid #1e3a5f',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            Завершённые
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {audits.map(audit => (
            <div key={audit.id} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {audit.number}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Тип: {audit.type} | Организация: {audit.organization}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Инспектор: {audit.inspector} | Дата: {audit.date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: audit.status === 'В процессе' ? '#ff9800' : '#2196f3',
                    color: 'white',
                  }}>
                    {audit.status}
                  </span>
                  <button
                    onClick={() => handleOpen(audit)}
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
            </div>
          ))}
        </div>

        <AuditCardModal
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedAudit(null);
          }}
          audit={selectedAudit}
          onSave={handleSaveAudit}
        />

        <AuditCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateAudit}
        />
      </div>
    </div>
  );
}
