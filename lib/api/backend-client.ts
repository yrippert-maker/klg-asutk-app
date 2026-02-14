/**
 * DEPRECATED: Use @/lib/api/api-client instead.
 * This file re-exports for backward compatibility with existing pages.
 */
import { aircraftApi, statsApi, risksApi, organizationsApi, auditsApi, PaginatedResponse } from './api-client';

function mapAircraft(a: any) {
  const at = a.aircraft_type;
  return {
    id: a.id, registrationNumber: a.registration_number,
    serialNumber: a.serial_number,
    aircraftType: at ? `${at.manufacturer || ''} ${at.model || ''}`.trim() : '',
    model: at?.model, operator: a.operator_name || '',
    status: a.current_status || 'active', manufacturer: at?.manufacturer,
    yearOfManufacture: a.manufacture_date ? new Date(a.manufacture_date).getFullYear() : undefined,
    flightHours: a.total_time,
  };
}

function mapRisk(r: any) {
  return {
    id: r.id, title: r.title, description: r.message, level: r.severity,
    status: r.is_resolved ? 'resolved' : 'open', aircraftId: r.aircraft_id,
    category: r.entity_type, createdAt: r.created_at,
  };
}

function mapAudit(a: any) {
  return {
    id: a.id, title: a.id, organization: '', organizationId: '',
    type: 'scheduled',
    status: a.status === 'completed' ? 'completed' : a.status === 'draft' ? 'planned' : 'in_progress',
    startDate: a.planned_at, endDate: a.completed_at, leadAuditor: '', findings: 0, criticalFindings: 0, scope: '',
  };
}

export async function fetchAircraftFromBackend(filters?: Record<string, string>): Promise<any[]> {
  const data = await aircraftApi.list({ q: filters?.q });
  return (data?.items || []).map(mapAircraft);
}

export async function fetchStatsFromBackend(): Promise<any> { return statsApi.get(); }

export async function fetchRiskAlertsFromBackend(filters?: Record<string, string>): Promise<any[]> {
  const params: any = {};
  if (filters?.level) params.severity = filters.level;
  if (filters?.status === 'resolved') params.resolved = true;
  const data = await risksApi.list(params);
  return (data?.items || []).map(mapRisk);
}

export async function fetchOrganizationsFromBackend(): Promise<any[]> {
  const data = await organizationsApi.list();
  return (data?.items || []).map((o: any) => ({
    id: o.id, name: o.name, type: o.kind || 'operator', country: '', city: o.address || '',
    certificate: o.ogrn || '', status: 'active', aircraftCount: 0, employeeCount: 0,
  }));
}

export async function fetchAuditsFromBackend(filters?: Record<string, string>): Promise<any[]> {
  const data = await auditsApi.list().catch(() => ({ items: [] }));
  return (data?.items || []).map(mapAudit);
}

// Re-export base fetch as backendFetch alias
export async function backendFetch<T = unknown>(path: string, opts?: RequestInit): Promise<T> {
  const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  const token = process.env.NEXT_PUBLIC_DEV_TOKEN || 'dev';
  const url = `${API}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers } });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return res.json();
}
