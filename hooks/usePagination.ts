/**
 * Хук для пагинации данных
 */
'use client';

import { useMemo, useState } from 'react';

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function usePagination<T>(
  data: T[],
  options: PaginationOptions
): PaginationResult<T> {
  const { page, limit, total } = options;

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return data.slice(startIndex, endIndex);
  }, [data, page, limit]);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
}

/**
 * Хук для бесконечной прокрутки
 */
export function useInfiniteScroll<T>(
  data: T[],
  pageSize: number = 20
): {
  visibleData: T[];
  loadMore: () => void;
  hasMore: boolean;
  reset: () => void;
} {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleData = useMemo(() => {
    return data.slice(0, visibleCount);
  }, [data, visibleCount]);

  const hasMore = visibleCount < data.length;

  const loadMore = () => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + pageSize, data.length));
    }
  };

  const reset = () => {
    setVisibleCount(pageSize);
  };

  return {
    visibleData,
    loadMore,
    hasMore,
    reset,
  };
}
