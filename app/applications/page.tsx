'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ApplicationCardModal from '@/components/ApplicationCardModal';
import ApplicationCreateModal from '@/components/ApplicationCreateModal';
import Logo from '@/components/Logo';

interface Application {
  id: string;
  number: string;
  type: string;
  status: string;
  aircraft: string;
  date: string;
  organization: string;
  description?: string;
  comments?: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      number: 'APP-2025-001',
      type: 'Регистрация ВС',
      status: 'В обработке',
      aircraft: 'RA-12345',
      date: '2025-01-15',
      organization: 'Аэрофлот',
    },
    {
      id: '2',
      number: 'APP-2025-002',
      type: 'Сертификация',
      status: 'На рассмотрении',
      aircraft: 'RA-67890',
      date: '2025-01-14',
      organization: 'S7 Airlines',
      description: 'Заявка на сертификацию воздушного судна RA-67890',
    },
  ]);

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpen = (application: Application) => {
    setSelectedApplication(application);
    setIsCardModalOpen(true);
  };

  const handleSaveApplication = (updatedApplication: Application) => {
    setApplications(prev => prev.map(a => a.id === updatedApplication.id ? updatedApplication : a));
    setSelectedApplication(updatedApplication);
  };

  const handleCreateApplication = (applicationData: any) => {
    const newApplication: Application = {
      id: `app-${Date.now()}`,
      ...applicationData,
    };
    setApplications(prev => [...prev, newApplication]);
    alert('Заявка успешно создана');
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
              Заявки
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление заявками на регистрацию и сертификацию воздушных судов
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
              Создать заявку
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
            В обработке
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
            На рассмотрении
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map(app => (
            <div key={app.id} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {app.number}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Тип: {app.type}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    ВС: {app.aircraft} | Организация: {app.organization}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Дата: {app.date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: app.status === 'В обработке' ? '#ff9800' : '#2196f3',
                    color: 'white',
                  }}>
                    {app.status}
                  </span>
                  <button
                    onClick={() => handleOpen(app)}
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

        <ApplicationCardModal
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onSave={handleSaveApplication}
        />

        <ApplicationCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateApplication}
        />
      </div>
    </div>
  );
}
