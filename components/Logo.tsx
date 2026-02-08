/**
 * Компонент логотипа REFLY
 */
'use client';

export default function Logo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isLarge = size === 'large';
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Иконка самолета */}
      <div
        style={{
          width: isLarge ? '48px' : '32px',
          height: isLarge ? '48px' : '32px',
          backgroundColor: '#1e3a5f',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isLarge ? '24px' : '18px',
        }}
      >
        ✈️
      </div>
      
      {/* Надпись REFLY */}
      <div
        style={{
          fontSize: isLarge ? '32px' : '24px',
          fontWeight: 'bold',
          color: '#1e3a5f',
          letterSpacing: '2px',
        }}
      >
        REFLY
      </div>
    </div>
  );
}
