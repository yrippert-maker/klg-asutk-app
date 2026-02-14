'use client';
import { useState, useMemo } from 'react';

interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  pageSize?: number;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, emptyMessage = 'Нет данных', loading, pageSize = 20,
}: Props<T>) {
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">⏳ Загрузка...</div>;
  if (!data.length) return <div className="card p-5 bg-blue-50 flex items-center gap-3"><span>ℹ️</span><span>{emptyMessage}</span></div>;

  return (
    <div className="space-y-2">
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(c => (
                <th key={c.key} className={`table-header cursor-pointer select-none hover:bg-gray-100 ${c.className || ''}`}
                  onClick={() => toggleSort(c.key)}>
                  {c.header || c.label || c.key}
                  {sortKey === c.key && <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={row.id || i} onClick={() => onRowClick?.(row)}
                className={`table-row ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''}`}>
                {columns.map(c => (
                  <td key={c.key} className="table-cell">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{sorted.length} записей · стр. {page + 1} из {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-1 rounded bg-gray-100 disabled:opacity-30">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-2 py-1 rounded bg-gray-100 disabled:opacity-30">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return p < totalPages ? (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2 py-1 rounded ${p === page ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>{p + 1}</button>
              ) : null;
            })}
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-2 py-1 rounded bg-gray-100 disabled:opacity-30">›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2 py-1 rounded bg-gray-100 disabled:opacity-30">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
