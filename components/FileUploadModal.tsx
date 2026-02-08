'use client';

import { useState, useRef } from 'react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export default function FileUploadModal({ isOpen, onClose, onUpload }: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Разрешенные типы файлов
  const allowedTypes = [
    'application/pdf',
    'image/png',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const allowedExtensions = ['.pdf', '.png', '.txt', '.doc', '.docx', '.csv', '.xls', '.xlsx'];

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      const isValidType = allowedTypes.includes(file.type) || 
        allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isValidType) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`Следующие файлы не поддерживаются:\n${invalidFiles.join('\n')}\n\nПоддерживаемые форматы: PDF, PNG, TXT, DOC, DOCX, CSV, XLS, XLSX`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      alert('Пожалуйста, выберите файлы для загрузки');
      return;
    }
    onUpload(selectedFiles);
    setSelectedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Загрузка документов</h2>
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

        <div
          style={{
            border: `2px dashed ${dragActive ? '#1e3a5f' : '#ccc'}`,
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f0f7ff' : '#fafafa',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.txt,.doc,.docx,.csv,.xls,.xlsx"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
            Перетащите файлы сюда или нажмите для выбора
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Поддерживаемые форматы: PDF, PNG, TXT, DOC, DOCX, CSV, XLS, XLSX
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Выбранные файлы ({selectedFiles.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '4px 8px',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            Отмена
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedFiles.length === 0 ? '#ccc' : '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Загрузить ({selectedFiles.length})
          </button>
        </div>
      </div>
    </div>
  );
}
