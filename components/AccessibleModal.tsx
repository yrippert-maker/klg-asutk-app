/**
 * Доступное модальное окно с поддержкой ARIA и фокус-ловкой
 */
'use client';

import { ReactNode, useEffect, useRef, useId } from 'react';
import { getModalAriaProps } from '@/lib/accessibility/aria';
import { createFocusTrap, createEscapeHandler } from '@/lib/accessibility/keyboard';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'medium',
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  
  const ariaProps = getModalAriaProps({
    titleId: `modal-title-${titleId}`,
    descriptionId: description ? `modal-description-${descriptionId}` : undefined,
  });

  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      return;
    }

    // Фокус-ловка
    const cleanupFocusTrap = createFocusTrap(modalRef.current, onClose);

    // Обработка Escape
    const handleEscape = createEscapeHandler(onClose);
    document.addEventListener('keydown', handleEscape);

    // Блокировка скролла body
    document.body.style.overflow = 'hidden';

    // Фокус на модальное окно
    modalRef.current.focus();

    return () => {
      cleanupFocusTrap();
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Сохраняем фокус на элементе, который открыл модальное окно
      const activeElement = document.activeElement as HTMLElement;
      
      return () => {
        // Возвращаем фокус при закрытии
        activeElement?.focus();
      };
    }
    return undefined;
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sizeStyles = {
    small: { maxWidth: '400px' },
    medium: { maxWidth: '600px' },
    large: { maxWidth: '800px' },
  };

  return (
    <div
      {...ariaProps}
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
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          outline: 'none',
          ...sizeStyles[size],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2
            id={`modal-title-${titleId}`}
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: description ? '8px' : 0,
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              id={`modal-description-${descriptionId}`}
              style={{
                fontSize: '14px',
                color: '#666',
                margin: 0,
              }}
            >
              {description}
            </p>
          )}
        </div>
        
        <div>{children}</div>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#1e3a5f',
              border: '1px solid #1e3a5f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            aria-label="Закрыть модальное окно"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
