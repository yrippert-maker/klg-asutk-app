/**
 * Компонент логотипа REFLY
 */
'use client';

export default function Logo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const isLarge = size === 'large';
  
  return (
    <div
     
    >
      {/* Иконка самолета */}
      <div
       
      >
        ✈️
      </div>
      
      {/* Надпись REFLY */}
      <div
       
      >
        REFLY
      </div>
    </div>
  );
}
