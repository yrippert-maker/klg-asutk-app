/**
 * Страница для тестирования доступности (упрощённая)
 */
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { getWCAGLevel } from '@/lib/accessibility/colors';

export default function AccessibilityTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contrastResult, setContrastResult] = useState<any>(null);

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
            <button
              onClick={() => alert('Кнопка 1')}
              style={{ padding: '10px 20px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Кнопка 1
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{ padding: '10px 20px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Открыть модальное окно
            </button>
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

        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Тестовое модальное окно</h3>
              <p>Нажмите Escape или кликните вне окна для закрытия.</p>
              <button onClick={() => setIsModalOpen(false)}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
