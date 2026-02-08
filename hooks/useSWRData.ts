/**
 * Хуки для использования SWR с кэшированием
 */
'use client';

import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';

/**
 * Хук для получения данных о воздушных судах
 */
export function useAircraftData(options?: {
  page?: number;
  limit?: number;
  paginate?: boolean;
}) {
  const { page = 1, limit = 50, paginate = false } = options || {};
  
  const url = paginate
    ? `/api/aircraft?page=${page}&limit=${limit}&paginate=true`
    : '/api/aircraft';
  
  return useSWR(url, fetcher, {
    ...swrConfig,
    refreshInterval: 60000, // Обновлять каждую минуту
    revalidateOnFocus: false,
  });
}

/**
 * Хук для получения данных о рисках
 */
export function useRisksData(filters?: {
  level?: string;
  status?: string;
  aircraftId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.level) params.append('level', filters.level);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.aircraftId) params.append('aircraftId', filters.aircraftId);
  
  const url = `/api/risks${params.toString() ? `?${params.toString()}` : ''}`;
  
  return useSWR(url, fetcher, {
    ...swrConfig,
    refreshInterval: 30000, // Обновлять каждые 30 секунд
  });
}

/**
 * Хук для получения данных об аудитах
 */
export function useAuditsData(filters?: {
  organizationId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.organizationId) params.append('organizationId', filters.organizationId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.append('dateTo', filters.dateTo);
  
  const url = `/api/audits${params.toString() ? `?${params.toString()}` : ''}`;
  
  return useSWR(url, fetcher, {
    ...swrConfig,
    refreshInterval: 30000,
  });
}

/**
 * Хук для получения статистики
 */
export function useStatsData() {
  return useSWR('/api/stats', fetcher, {
    ...swrConfig,
    refreshInterval: 60000, // Обновлять каждую минуту
    revalidateOnFocus: true, // Обновлять при фокусе для актуальной статистики
  });
}

/**
 * Хук для получения данных об организациях
 */
export function useOrganizationsData() {
  return useSWR('/api/organizations', fetcher, {
    ...swrConfig,
    refreshInterval: 300000, // Обновлять каждые 5 минут
  });
}
