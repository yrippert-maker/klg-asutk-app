'use client';

import { RegulationDocument } from '@/lib/regulations';

interface RegulationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RegulationDocument | null;
}

export default function RegulationViewModal({ isOpen, onClose, document }: RegulationViewModalProps) {
  if (!isOpen || !document) {
    return null;
  }

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
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              {document.title}
            </h2>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Источник: {document.source} | Категория: {document.category}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Версия: {document.version} | Обновлено: {new Date(document.lastUpdated).toLocaleDateString('ru-RU')}
            </div>
          </div>
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

        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {document.content}
          </div>
        </div>

        {document.sections && document.sections.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Приложения и разделы
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {document.sections.map(section => (
                <div
                  key={section.id}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                    {section.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {document.url && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1e3a5f',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Открыть оригинальный документ на официальном сайте →
            </a>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
