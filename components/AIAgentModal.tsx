'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: File[];
}

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAgentModal({ isOpen, onClose }: AIAgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Здравствуйте! Я ИИ агент системы контроля лётной годности. Чем могу помочь? Я могу помочь с анализом документов, внесением данных в базу, поиском информации и другими задачами.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) {
    return null;
  }

  const handleSend = async () => {
    if (!inputValue.trim() && attachedFiles.length === 0) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    const currentFiles = attachedFiles;
    setInputValue('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      // Если есть файлы, отправляем их через FormData
      let response: Response;
      
      if (currentFiles.length > 0) {
        const formData = new FormData();
        formData.append('message', currentInput);
        formData.append('history', JSON.stringify(messages.map(m => ({
          role: m.role,
          content: m.content,
        }))));
        
        // Добавляем файлы
        currentFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
        
        formData.append('fileCount', currentFiles.length.toString());
        
        response = await fetch('/api/ai-chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Обычный запрос без файлов
        response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            history: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Извините, произошла ошибка при обработке запроса.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Ошибка при запросе к AI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при подключении к ИИ агенту. Попробуйте позже.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      // Фильтруем только разрешенные типы файлов
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png', '.xls', '.xlsx', '.csv', '.txt', '.doc', '.docx'];
      
      const validFiles = newFiles.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedTypes.includes(file.type) || allowedExtensions.includes(extension);
      });
      
      if (validFiles.length !== newFiles.length) {
        alert('Некоторые файлы не поддерживаются. Разрешены: PDF, JPEG, PNG, XLS, XLSX, CSV, TXT, DOC, DOCX');
      }
      
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          width: '90%',
          maxWidth: '900px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              ИИ Агент
            </h2>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
              Помощник по управлению системой контроля лётной годности
            </p>
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

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          backgroundColor: '#f9f9f9',
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: message.role === 'user' ? '#1e3a5f' : 'white',
                color: message.role === 'user' ? 'white' : '#333',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                {message.files && message.files.length > 0 && (
                  <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                    {message.files.map((file, idx) => (
                      <div key={idx} style={{ fontSize: '12px', opacity: 0.9 }}>
                        📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  marginTop: '8px',
                }}>
                  {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: '20px',
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ animation: 'blink 1s infinite' }}>●</span>
                  <span style={{ animation: 'blink 1s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'blink 1s infinite 0.4s' }}>●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <span>📎</span>
                <span>{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#f44336',
                    fontSize: '16px',
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: 'white',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px',
                minWidth: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Прикрепить файл (PDF, JPEG, PNG, XLS, CSV, TXT)"
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.jpeg,.jpg,.png,.xls,.xlsx,.csv,.txt,.doc,.docx"
              style={{ display: 'none' }}
            />
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение... (Enter для отправки, Shift+Enter для новой строки)"
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                minHeight: '40px',
                maxHeight: '120px',
              }}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
              style={{
                padding: '10px 20px',
                backgroundColor: isLoading || (!inputValue.trim() && attachedFiles.length === 0) ? '#ccc' : '#1e3a5f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading || (!inputValue.trim() && attachedFiles.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '100px',
                height: '40px',
              }}
            >
              {isLoading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
