/**
 * Клиент для запросов к FastAPI бэкенду.
 * Используется Next.js API routes при NEXT_PUBLIC_USE_MOCK_DATA=false.
 */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND}/api/v1`;
const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN || process.env.DEV_TOKEN || 'dev';

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${DEV_TOKEN}`,
  };
}

export async function backendFetch<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...opts?.headers } });
  if (!res.ok) throw new Error(`Backend ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Преобразование aircraft из формата бэкенда в формат фронтенда */
function mapAircraft(a: any) {
  const at = a.aircraft_type;
  return {
    id: a.id,
    registrationNumber: a.registration_number,
    serialNumber: a.serial_number,
    aircraftType: at ? `${at.manufacturer || ''} ${at.model || ''}`.trim() : '',
    model: at?.model,
    operator: a.operator_name || '',
    status: a.current_status || 'active',
    manufacturer: at?.manufacturer,
    yearOfManufacture: a.manufacture_date ? new Date(a.manufacture_date).getFullYear() : undefined,
    flightHours: a.total_time,
    engineType: undefined,
    lastInspectionDate: undefined,
    nextInspectionDate: undefined,
    certificateExpiry: undefined,
  };
}

/** risk-alerts → risks (формат дашборда) */
function mapRiskAlert(r: any) {
  return {
    id: r.id,
    title: r.title,
    description: r.message,
    level: r.severity,
    status: r.is_resolved ? 'resolved' : 'open',
    aircraftId: r.aircraft_id,
    category: r.entity_type,
    createdAt: r.created_at,
  };
}

/** Audit → audits (формат дашборда) */
function mapAudit(a: any) {
  return {
    id: a.id,
    title: a.id,
    organization: '',
    organizationId: '',
    type: 'scheduled',
    status: a.status === 'completed' ? 'completed' : a.status === 'draft' ? 'planned' : 'in_progress',
    startDate: a.planned_at,
    endDate: a.completed_at,
    leadAuditor: '',
    findings: 0,
    criticalFindings: 0,
    scope: '',
  };
}

export async function fetchAircraftFromBackend(filters?: Record<string, string>): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.q) params.set('q', filters.q);
  const list = await backendFetch<any[]>(`/aircraft?${params}`);
  return (Array.isArray(list) ? list : []).map(mapAircraft);
}

export async function fetchStatsFromBackend(): Promise<any> {
  return backendFetch<any>('/stats');
}

export async function fetchRiskAlertsFromBackend(filters?: Record<string, string>): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.level) params.set('severity', filters.level);
  if (filters?.status === 'resolved') params.set('resolved', 'true');
  const list = await backendFetch<any[]>(`/risk-alerts?${params}`);
  return (Array.isArray(list) ? list : []).map(mapRiskAlert);
}

export async function fetchOrganizationsFromBackend(): Promise<any[]> {
  const list = await backendFetch<any[]>('/organizations');
  return (Array.isArray(list) ? list : []).map((o) => ({
    id: o.id,
    name: o.name,
    type: o.kind || 'operator',
    country: '',
    city: o.address || '',
    certificate: o.ogrn || '',
    status: 'active',
    aircraftCount: 0,
    employeeCount: 0,
  }));
}

export async function fetchAuditsFromBackend(filters?: Record<string, string>): Promise<any[]> {
  const list = await backendFetch<any[]>('/audits').catch(() => []);
  if (!Array.isArray(list)) return [];
  return list.map(mapAudit);
}
