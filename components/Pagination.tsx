/**
 * Компонент пагинации
 */
'use client';

import { useUrlParams } from '@/hooks/useUrlParams';

interface PaginationProps {
  total: number;
  limit: number;
  currentPage: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  total,
  limit,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const { setPage } = useUrlParams();
  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPage(page);
      onPageChange?.(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ fontSize: '14px', color: '#666' }}>
        Показано {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} из {total}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            backgroundColor: currentPage === 1 ? '#f5f5f5' : '#1e3a5f',
            color: currentPage === 1 ? '#999' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          ← Назад
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} style={{ padding: '8px', color: '#999' }}>
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              style={{
                padding: '8px 12px',
                backgroundColor: isActive ? '#1e3a5f' : 'white',
                color: isActive ? 'white' : '#1e3a5f',
                border: `1px solid ${isActive ? '#1e3a5f' : '#ddd'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? 'bold' : 'normal',
              }}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#1e3a5f',
            color: currentPage === totalPages ? '#999' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
