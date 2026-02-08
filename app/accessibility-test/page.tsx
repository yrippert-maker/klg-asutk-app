/**
 * Страница для тестирования доступности
 */
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AccessibleButton from '@/components/AccessibleButton';
import AccessibleInput from '@/components/AccessibleInput';
import AccessibleModal from '@/components/AccessibleModal';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { getWCAGLevel } from '@/lib/accessibility/colors';

export default function AccessibilityTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contrastResult, setContrastResult] = useState<any>(null);

  // Регистрация горячих клавиш
  useKeyboardNavigation([
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        alert('Глобальный поиск (Ctrl+K)');
      },
    },
    {
      key: 'Escape',
      handler: () => {
        if (isModalOpen) {
          setIsModalOpen(false);
        }
      },
    },
  ]);

  const testContrast = () => {
    const result = getWCAGLevel('#1e3a5f', '#ffffff', false);
    setContrastResult(result);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
          Тестирование доступности
        </h1>

        <section aria-labelledby="keyboard-nav-heading" style={{ marginBottom: '32px' }}>
          <h2 id="keyboard-nav-heading" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            Навигация с клавиатуры
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <AccessibleButton
              onClick={() => alert('Кнопка 1')}
              ariaLabel="Тестовая кнопка 1"
            >
              Кнопка 1
            </AccessibleButton>
            <AccessibleButton
              onClick={() => alert('Кнопка 2')}
              ariaLabel="Тестовая кнопка 2"
            >
              Кнопка 2
            </AccessibleButton>
            <AccessibleButton
              onClick={() => setIsModalOpen(true)}
              ariaLabel="Открыть модальное окно"
            >
              Открыть модальное окно
            </AccessibleButton>
          </div>
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
            Попробуйте навигацию с клавиатуры: Tab для перехода, Enter/Space для активации, Escape для закрытия модальных окон.
          </p>
        </section>

        <section aria-labelledby="forms-heading" style={{ marginBottom: '32px' }}>
          <h2 id="forms-heading" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            Доступные формы
          </h2>
          <div style={{ maxWidth: '500px' }}>
            <AccessibleInput
              label="Имя пользователя"
              name="username"
              required
              hint="Введите ваше имя пользователя"
            />
            <AccessibleInput
              label="Email"
              name="email"
              type="email"
              required
              error="Неверный формат email"
            />
          </div>
        </section>

        <section aria-labelledby="contrast-heading" style={{ marginBottom: '32px' }}>
          <h2 id="contrast-heading" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            Проверка контраста цветов
          </h2>
          <button
            onClick={testContrast}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Проверить контраст
          </button>
          {contrastResult && (
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <p>Контраст: {contrastResult.ratio.toFixed(2)}:1</p>
              <p>WCAG AA: {contrastResult.aa ? '✅' : '❌'}</p>
              <p>WCAG AAA: {contrastResult.aaa ? '✅' : '❌'}</p>
            </div>
          )}
        </section>

        <AccessibleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Тестовое модальное окно"
          description="Это модальное окно поддерживает навигацию с клавиатуры и фокус-ловку"
        >
          <p>Содержимое модального окна. Нажмите Escape или кликните вне окна для закрытия.</p>
        </AccessibleModal>
      </div>
    </div>
  );
}
