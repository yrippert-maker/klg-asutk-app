'use client';
import { Modal } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; }

const shortcuts = [
  { keys: '⌘/Ctrl + K', action: 'Глобальный поиск' },
  { keys: '⌘/Ctrl + N', action: 'Создать новый объект' },
  { keys: '⌘/Ctrl + ,', action: 'Настройки' },
  { keys: '⌘/Ctrl + .', action: 'AI Ассистент' },
  { keys: 'Escape', action: 'Закрыть модальное окно' },
  { keys: '?', action: 'Показать горячие клавиши' },
  { keys: '←/→', action: 'Навигация по страницам' },
  { keys: '⌘/Ctrl + E', action: 'Экспорт данных' },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⌨️ Горячие клавиши" size="sm">
      <div className="space-y-1">
        {shortcuts.map(s => (
          <div key={s.keys} className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-sm">{s.action}</span>
            <kbd className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{s.keys}</kbd>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">Нажмите ? в любом месте для вызова этого окна</p>
    </Modal>
  );
}
