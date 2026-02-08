'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DocumentViewModal from '@/components/DocumentViewModal';
import Logo from '@/components/Logo';

interface Document {
  id: string;
  name: string;
  type: string;
  aircraft: string;
  date: string;
  status: string;
  size: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Сертификат лётной годности',
      type: 'Сертификат',
      aircraft: 'RA-12345',
      date: '2025-01-15',
      status: 'Действителен',
      size: '2.5 МБ',
    },
    {
      id: '2',
      name: 'Техническая документация',
      type: 'Техническая',
      aircraft: 'RA-67890',
      date: '2025-01-10',
      status: 'Действителен',
      size: '15.3 МБ',
    },
    {
      id: '3',
      name: 'Отчёт о техническом обслуживании',
      type: 'Отчёт',
      aircraft: 'RA-11111',
      date: '2025-01-20',
      status: 'Требует обновления',
      size: '1.2 МБ',
    },
  ]);

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleDownload = (doc: Document) => {
    // Имитация скачивания документа
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${doc.name}.pdf`;
    link.click();
    alert(`Документ "${doc.name}" скачивается...`);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewModalOpen(true);
  };

  const handleStatusChange = (doc: Document) => {
    const newStatus = doc.status === 'Действителен' ? 'Требует обновления' : 'Действителен';
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, status: newStatus } : d
    ));
    alert(`Статус документа "${doc.name}" изменён на "${newStatus}"`);
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
              Документы
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление документацией воздушных судов
            </p>
          </div>
          <div>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Загрузить документ
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
            Сертификаты
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
            Отчёты
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Тип: {doc.type} | ВС: {doc.aircraft} | Размер: {doc.size}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Дата: {doc.date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleStatusChange(doc)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: doc.status === 'Действителен' ? '#4caf50' : '#ff9800',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Нажмите для изменения статуса"
                  >
                    {doc.status}
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
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
                    Скачать
                  </button>
                  <button
                    onClick={() => handleView(doc)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: '#1e3a5f',
                      border: '1px solid #1e3a5f',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Просмотр
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DocumentViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
        />
      </div>
    </div>
  );
}
