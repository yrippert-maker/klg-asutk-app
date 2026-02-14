/**
 * SWR hooks for КЛГ АСУ ТК — using unified API client.
 * All hooks now call FastAPI directly via api-client.ts.
 * Разработчик: АО «REFLY»
 */
'use client';

import useSWR from 'swr';
import {
  aircraftApi, organizationsApi, risksApi, auditsApi,
  statsApi, applicationsApi, checklistsApi, usersApi,
  PaginatedResponse,
} from '@/lib/api/api-client';

const SWR_OPTS = { revalidateOnFocus: false, dedupingInterval: 5000 };

/** Aircraft list (paginated) */
export function useAircraftData(options?: { page?: number; limit?: number; q?: string; paginate?: boolean }) {
  const { page = 1, limit = 25, q, paginate = true } = options || {};
  return useSWR(
    ['aircraft', page, limit, q],
    () => aircraftApi.list({ page, per_page: limit, q }),
    { ...SWR_OPTS, refreshInterval: 60_000 },
  );
}

/** Stats for dashboard */
export function useStatsData() {
  return useSWR('stats', () => statsApi.get(), { ...SWR_OPTS, refreshInterval: 60_000 });
}

/** Risks (paginated) */
export function useRisksData(filters?: { level?: string; status?: string; aircraftId?: string }) {
  const params: any = {};
  if (filters?.level) params.severity = filters.level;
  if (filters?.status === 'resolved') params.resolved = true;
  if (filters?.aircraftId) params.aircraft_id = filters.aircraftId;
  return useSWR(['risks', filters], () => risksApi.list(params), { ...SWR_OPTS, refreshInterval: 30_000 });
}

/** Audits (paginated) */
export function useAuditsData(filters?: { organizationId?: string; status?: string }) {
  const params: any = {};
  if (filters?.status) params.status = filters.status;
  return useSWR(['audits', filters], () => auditsApi.list(params), { ...SWR_OPTS, refreshInterval: 30_000 });
}

/** Organizations (paginated) */
export function useOrganizationsData(params?: { q?: string; page?: number; per_page?: number }) {
  return useSWR(['organizations', params], () => organizationsApi.list(params), { ...SWR_OPTS, refreshInterval: 120_000 });
}

/** Cert Applications (paginated) */
export function useApplicationsData(params?: { status?: string; page?: number; per_page?: number }) {
  return useSWR(['applications', params], () => applicationsApi.list(params), { ...SWR_OPTS, refreshInterval: 30_000 });
}

/** Checklists */
export function useChecklistsData(params?: { domain?: string }) {
  return useSWR(['checklists', params], () => checklistsApi.listTemplates(params), SWR_OPTS);
}

/** Users */
export function useUsersData(params?: { organization_id?: string; role?: string }) {
  return useSWR(['users', params], () => usersApi.list(params), SWR_OPTS);
}
