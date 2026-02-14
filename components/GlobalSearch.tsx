'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TYPE_ICONS: Record<string, string> = {
  directive: '⚠️', bulletin: '📢', component: '🔩', work_order: '📐',
  defect: '🛠️', specialist: '🎓', aircraft: '✈️',
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout>();

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/v1/search/global?q=${encodeURIComponent(q)}`);
        const data = await r.json();
        setResults(data.results || []);
        setOpen(true);
      } catch { setResults([]); }
    }, 300);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input type="text" placeholder="🔍 Поиск..." value={query}
        onChange={e => { setQuery(e.target.value); search(e.target.value); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="w-full px-3 py-2 text-sm rounded-lg bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} onClick={() => { router.push(r.url); setOpen(false); setQuery(''); }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <span>{TYPE_ICONS[r.type] || '📋'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-[10px] text-gray-400 truncate">{r.subtitle}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
