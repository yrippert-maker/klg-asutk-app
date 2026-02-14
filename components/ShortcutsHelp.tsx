'use client';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

export default function ShortcutsHelp({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">⌨️ Горячие клавиши</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="space-y-1">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-sm text-gray-600">{s.desc}</span>
              <kbd className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[10px] text-gray-400 text-center">Нажмите ? или Ctrl+/ для открытия этого окна</div>
      </div>
    </div>
  );
}
