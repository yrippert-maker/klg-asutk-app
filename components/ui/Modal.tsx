'use client';
import { useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

export default function Modal({ isOpen, onClose, title, size = 'md', children, footer }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-in`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer text-xl" aria-label="Закрыть">×</button>
        </div>
        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
