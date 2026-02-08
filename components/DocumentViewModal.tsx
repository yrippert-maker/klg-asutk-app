'use client';

interface Document {
  id: string;
  name: string;
  type: string;
  aircraft: string;
  date: string;
  status: string;
  size: string;
}

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export default function DocumentViewModal({ isOpen, onClose, document }: DocumentViewModalProps) {
  if (!isOpen || !document) return null;

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
              {document.name}
            </h2>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Тип: {document.type} | ВС: {document.aircraft}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              Размер: {document.size} | Дата: {document.date}
            </div>
            <div style={{ marginTop: '12px' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: document.status === 'Действителен' ? '#4caf50' : '#ff9800',
                color: 'white',
              }}>
                {document.status}
              </span>
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
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Просмотр документа
          </div>
          <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>
            Здесь будет отображаться содержимое документа. В реальном приложении здесь будет встроенный просмотрщик PDF или изображения.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
            onClick={() => {
              // Имитация скачивания
              const link = window.document.createElement('a');
              link.href = '#';
              link.download = `${document.name}.pdf`;
              link.click();
              alert(`Документ "${document.name}" скачивается...`);
            }}
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
            Скачать
          </button>
        </div>
      </div>
    </div>
  );
}
