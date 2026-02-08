/**
 * Хук для работы с URL параметрами (фильтры, сортировка, пагинация)
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface FilterParams {
  search?: string;
  status?: string[];
  organization?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useUrlParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const params: FilterParams = {};

    const search = searchParams.get('search');
    if (search) {
      params.search = search;
    }

    const status = searchParams.get('status');
    if (status) {
      params.status = status.split(',');
    }

    const organization = searchParams.get('organization');
    if (organization) {
      params.organization = organization;
    }

    const type = searchParams.get('type');
    if (type) {
      params.type = type;
    }

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      params.dateFrom = dateFrom;
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      params.dateTo = dateTo;
    }

    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      params.sortBy = sortBy;
    }

    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;
    if (sortOrder) {
      params.sortOrder = sortOrder;
    }

    const page = searchParams.get('page');
    if (page) {
      params.page = parseInt(page, 10);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      params.limit = parseInt(limit, 10);
    }

    return params;
  }, [searchParams]);

  const updateParams = useCallback(
    (updates: Partial<FilterParams>, replace: boolean = false) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          newParams.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            newParams.set(key, value.join(','));
          } else {
            newParams.delete(key);
          }
        } else {
          newParams.set(key, String(value));
        }
      });

      const method = replace ? router.replace : router.push;
      method(`?${newParams.toString()}`);
    },
    [router, searchParams]
  );

  const setSearch = useCallback(
    (search: string) => {
      updateParams({ search, page: 1 });
    },
    [updateParams]
  );

  const setFilters = useCallback(
    (filters: Partial<FilterParams>) => {
      updateParams({ ...filters, page: 1 });
    },
    [updateParams]
  );

  const setSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
      updateParams({ sortBy, sortOrder });
    },
    [updateParams]
  );

  const setPage = useCallback(
    (page: number) => {
      updateParams({ page });
    },
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    router.replace('?');
  }, [router]);

  return {
    params,
    updateParams,
    setSearch,
    setFilters,
    setSort,
    setPage,
    clearFilters,
  };
}
