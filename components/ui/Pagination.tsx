'use client';

interface Props {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, onPageChange }: Props) {
  if (pages <= 1) return null;
  return (
    <div className="nav-pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="nav-btn">← Назад</button>
      <span className="px-4 py-2 text-sm text-gray-600">Стр. {page} из {pages}</span>
      <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="nav-btn">Вперёд →</button>
    </div>
  );
}
