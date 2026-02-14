/**
 * Unified API client for КЛГ АСУ ТК.
 * Single source of truth: all requests go to FastAPI backend.
 * Replaces: backend-client.ts + cached-api.ts + Next.js API routes.
 *
 * Разработчик: АО «REFLY»
 */

// In production, NEXT_PUBLIC_API_URL points to FastAPI.
// In development, Next.js proxies via rewrites in next.config.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ─── Auth ────────────────────────────────────────
let _token: string | null = null;

export function setAuthToken(token: string) {
  _token = token;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('klg_token', token);
  }
}

export function getAuthToken(): string | null {
  if (_token) return _token;
  if (typeof window !== 'undefined') {
    _token = sessionStorage.getItem('klg_token');
  }
  // Fallback to dev token
  return _token || process.env.NEXT_PUBLIC_DEV_TOKEN || null;
}

export function clearAuthToken() {
  _token = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('klg_token');
  }
}

// ─── Base fetch ──────────────────────────────────
export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Unified fetch with auth and 401 handling. Use for any backend path (e.g. /stats, /airworthiness-core/directives). */
export async function apiFetch<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string> || {}),
  };

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { ...opts, headers });

  if (res.status === 401) {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.detail || `HTTP ${res.status}`, body);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ─── Paginated response type ─────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

interface QueryParams {
  page?: number;
  per_page?: number;
  q?: string;
  [key: string]: any;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ─── Resource APIs ───────────────────────────────

// Stats
export const statsApi = {
  get: () => apiFetch('/stats'),
};

// Organizations
export const organizationsApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/organizations${buildQuery(params)}`),
  get: (id: string) => apiFetch(`/organizations/${id}`),
  create: (data: any) => apiFetch('/organizations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/organizations/${id}`, { method: 'DELETE' }),
};

// Aircraft
export const aircraftApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/aircraft${buildQuery(params)}`),
  get: (id: string) => apiFetch(`/aircraft/${id}`),
  create: (data: any) => apiFetch('/aircraft', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/aircraft/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/aircraft/${id}`, { method: 'DELETE' }),
  types: () => apiFetch<any[]>('/aircraft/types'),
};

// Cert Applications
export const applicationsApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/cert-applications${buildQuery(params)}`),
  get: (id: string) => apiFetch(`/cert-applications/${id}`),
  create: (data: any) => apiFetch('/cert-applications', { method: 'POST', body: JSON.stringify(data) }),
  submit: (id: string) => apiFetch(`/cert-applications/${id}/submit`, { method: 'POST' }),
  startReview: (id: string) => apiFetch(`/cert-applications/${id}/start-review`, { method: 'POST' }),
  approve: (id: string) => apiFetch(`/cert-applications/${id}/approve`, { method: 'POST' }),
  reject: (id: string) => apiFetch(`/cert-applications/${id}/reject`, { method: 'POST' }),
  addRemark: (id: string, data: any) => apiFetch(`/cert-applications/${id}/remarks`, { method: 'POST', body: JSON.stringify(data) }),
  listRemarks: (id: string) => apiFetch<any[]>(`/cert-applications/${id}/remarks`),
};

// Airworthiness
export const airworthinessApi = {
  listCertificates: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/airworthiness/certificates${buildQuery(params)}`),
  getCertificate: (id: string) => apiFetch(`/airworthiness/certificates/${id}`),
  createCertificate: (data: any) => apiFetch('/airworthiness/certificates', { method: 'POST', body: JSON.stringify(data) }),
  updateCertificate: (id: string, data: any) => apiFetch(`/airworthiness/certificates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getHistory: (aircraftId: string, params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/aircraft/${aircraftId}/history${buildQuery(params)}`),
};

// Modifications
export const modificationsApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/modifications${buildQuery(params)}`),
  listForAircraft: (aircraftId: string, params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/aircraft/${aircraftId}/modifications${buildQuery(params)}`),
  get: (id: string) => apiFetch(`/modifications/${id}`),
  create: (aircraftId: string, data: any) => apiFetch(`/aircraft/${aircraftId}/modifications`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/modifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Risk Alerts
export const risksApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/risk-alerts${buildQuery(params)}`),
  scan: () => apiFetch('/risk-alerts/scan', { method: 'POST' }),
  resolve: (id: string) => apiFetch(`/risk-alerts/${id}/resolve`, { method: 'PATCH' }),
};

// Audits
export const auditsApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/audits${buildQuery(params)}`),
  get: (id: string) => apiFetch(`/audits/${id}`),
  create: (data: any) => apiFetch('/audits', { method: 'POST', body: JSON.stringify(data) }),
  complete: (id: string) => apiFetch(`/audits/${id}/complete`, { method: 'PATCH' }),
  submitResponse: (auditId: string, data: any) => apiFetch(`/audits/${auditId}/responses`, { method: 'POST', body: JSON.stringify(data) }),
  listResponses: (auditId: string) => apiFetch<any[]>(`/audits/${auditId}/responses`),
  listFindings: (auditId: string) => apiFetch<any[]>(`/audits/${auditId}/findings`),
};

// Checklists
export const checklistsApi = {
  listTemplates: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/checklists/templates${buildQuery(params)}`),
  getTemplate: (id: string) => apiFetch(`/checklists/templates/${id}`),
  createTemplate: (data: any) => apiFetch('/checklists/templates', { method: 'POST', body: JSON.stringify(data) }),
  generate: (source: string, name: string, items?: any[]) => apiFetch(`/checklists/generate?source=${source}&name=${name}`, { method: 'POST', body: items ? JSON.stringify(items) : undefined }),
};

// Notifications
export const notificationsApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/notifications${buildQuery(params)}`),
  markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiFetch('/notifications/read-all', { method: 'POST' }),
};

// Users
export const usersApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/users${buildQuery(params)}`),
  get: (id: string) => apiFetch(`/users/${id}`),
  me: () => apiFetch('/users/me'),
};

// Tasks
export const tasksApi = {
  list: (state?: string) => apiFetch<any[]>(`/tasks?state=${state || 'open'}`),
};

// Audit Log
export const auditLogApi = {
  list: (params?: QueryParams) => apiFetch<PaginatedResponse<any>>(`/audit/events${buildQuery(params)}`),
};

// Attachments
export const attachmentsApi = {
  upload: async (ownerKind: string, ownerId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/attachments/${ownerKind}/${ownerId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new ApiError(res.status, 'Upload failed');
    return res.json();
  },
  list: (ownerKind: string, ownerId: string) => apiFetch<any[]>(`/attachments/${ownerKind}/${ownerId}`),
  downloadUrl: (id: string) => `${API_BASE}/attachments/${id}/download`,
};

// Health
export const healthApi = {
  check: () => apiFetch('/health'),
};
