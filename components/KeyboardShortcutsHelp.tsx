/**
 * Компонент для отображения подсказок по горячим клавишам
 */
'use client';

export default function KeyboardShortcutsHelp() {
  const shortcuts: Array<{ keys: string; description: string }> = [
    { keys: 'Ctrl+K', description: 'Глобальный поиск' },
    { keys: 'Ctrl+N', description: 'Создать новую запись' },
    { keys: 'Ctrl+S', description: 'Сохранить форму' },
    { keys: 'Esc', description: 'Закрыть модальное окно' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 1000,
        maxWidth: '300px',
      }}
    >
      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
        Горячие клавиши
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#666' }}>{shortcut.description}</span>
            <kbd
              style={{
                padding: '4px 8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '11px',
              }}
            >
              {shortcut.keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
