'use client';

/** Исправлено: все className с шаблонными строками в виде className={\`...\`} */

interface Props {
  iconSize?: number;
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

const strokeColor = (v: 'light' | 'dark') => (v === 'light' ? 'white' : '#4CAF50');

export default function ReflyLogo({ iconSize = 40, showText = true, className = '', variant = 'light' }: Props) {
  const stroke = strokeColor(variant);
  const wrapperClass = `flex items-center gap-2 ${className}`;
  const circleFill = variant === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(76,175,80,0.15)';
  const textClass = `text-xl font-bold tracking-wider whitespace-nowrap ${variant === 'light' ? 'text-white' : 'text-primary-600'}`;

  return (
    <div className={wrapperClass}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <circle cx="20" cy="20" r="19" fill={circleFill} stroke={stroke} strokeWidth="1.5" />
        <path d="M12 20 L20 12 L28 20 L20 28 Z" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 20 L26 20" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 14 L20 26" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 16 L24 24 M24 16 L16 24" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      </svg>
      {showText && <span className={textClass}>REFLY</span>}
    </div>
  );
}
