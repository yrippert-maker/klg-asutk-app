export interface Aircraft {
  id: string;
  registrationNumber: string;
  serialNumber: string;
  aircraftType: string;
  model: string;
  operator: string;
  status: string;
  flightHours?: number;
  manufacturer?: string;
  yearOfManufacture?: number;
  maxTakeoffWeight?: number;
  engineType?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  certificateExpiry?: string;
  date?: string;
  rating?: number;
  notes?: string;
  [key: string]: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(API_BASE + path, { ...opts, headers: { "Content-Type": "application/json", ...opts.headers } });
  if (res.ok === false) throw new Error("API error: " + res.status);
  return res.json();
}

export const aircraftApi = {
  getAircraft: () => apiFetch("/aircraft"),
  getAll: () => apiFetch("/aircraft"),
  getById: (id: string) => apiFetch("/aircraft/" + id),
  create: (data: any) => apiFetch("/aircraft", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch("/aircraft/" + id, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch("/aircraft/" + id, { method: "DELETE" }),
};

export default { fetch: apiFetch };
