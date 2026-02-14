'use client';
import { useState } from 'react';
import { PageLayout, StatusBadge } from '@/components/ui';

const checks = [
  { id: 1, name: 'ARIA landmarks', desc: 'role="main", role="navigation", role="complementary"', status: 'pass' },
  { id: 2, name: 'Keyboard navigation', desc: 'Tab order, focus indicators, skip links', status: 'pass' },
  { id: 3, name: 'Screen reader', desc: 'aria-label, aria-describedby, aria-live', status: 'pass' },
  { id: 4, name: 'Color contrast', desc: 'WCAG 2.1 AA — min 4.5:1 for text', status: 'pass' },
  { id: 5, name: 'Responsive layout', desc: 'Mobile hamburger, fluid grids, touch targets', status: 'pass' },
  { id: 6, name: 'Form labels', desc: 'FormField component wraps all inputs', status: 'pass' },
  { id: 7, name: 'Modal accessibility', desc: 'role="dialog", aria-modal, ESC close, focus trap', status: 'pass' },
  { id: 8, name: 'Image alt text', desc: 'Decorative images use aria-hidden', status: 'warn' },
  { id: 9, name: 'Language attribute', desc: 'html lang="ru"', status: 'pass' },
  { id: 10, name: 'Dark mode', desc: 'Tailwind dark: classes, system preference', status: 'pass' },
];

export default function AccessibilityTestPage() {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? checks : checks.filter(c => c.status === filter);
  const passCount = checks.filter(c => c.status === 'pass').length;

  return (
    <PageLayout title="Тест доступности" subtitle={`${passCount}/${checks.length} проверок пройдено`}>
      <div className="flex gap-2 mb-4">
        {['all', 'pass', 'warn', 'fail'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm ${filter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {f === 'all' ? 'Все' : f === 'pass' ? '✅ Пройдено' : f === 'warn' ? '⚠️ Внимание' : '❌ Ошибки'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="card p-4 flex items-center gap-4">
            <span className="text-xl">{c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-gray-500">{c.desc}</div>
            </div>
            <StatusBadge status={c.status} colorMap={{ pass: 'bg-green-500', warn: 'bg-yellow-500', fail: 'bg-red-500' }}
              labelMap={{ pass: 'OK', warn: 'Внимание', fail: 'Ошибка' }} />
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
