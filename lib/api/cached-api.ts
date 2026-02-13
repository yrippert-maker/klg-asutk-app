import {
  fetchAircraftFromBackend,
  fetchStatsFromBackend,
  fetchRiskAlertsFromBackend,
  fetchOrganizationsFromBackend,
  fetchAuditsFromBackend,
} from './backend-client';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

const MOCK_AIRCRAFT = [
  { id: "ac-001", registrationNumber: "RA-73701", serialNumber: "MSN-4521", aircraftType: "Boeing 737-800", model: "737-800", operator: "REFLY Airlines", status: "active", manufacturer: "Boeing", yearOfManufacture: 2015, flightHours: 28450, engineType: "CFM56-7B26", lastInspectionDate: "2025-12-15", nextInspectionDate: "2026-06-15", certificateExpiry: "2027-01-20" },
  { id: "ac-002", registrationNumber: "RA-73702", serialNumber: "MSN-4890", aircraftType: "Boeing 737-800", model: "737-800", operator: "REFLY Airlines", status: "active", manufacturer: "Boeing", yearOfManufacture: 2016, flightHours: 24120, engineType: "CFM56-7B26", lastInspectionDate: "2026-01-10", nextInspectionDate: "2026-07-10", certificateExpiry: "2027-03-15" },
  { id: "ac-003", registrationNumber: "RA-89001", serialNumber: "MSN-95012", aircraftType: "Sukhoi Superjet 100", model: "SSJ-100", operator: "REFLY Regional", status: "active", manufacturer: "Sukhoi", yearOfManufacture: 2018, flightHours: 15600, engineType: "SaM146-1S18", lastInspectionDate: "2025-11-20", nextInspectionDate: "2026-05-20", certificateExpiry: "2026-12-01" },
  { id: "ac-004", registrationNumber: "RA-89002", serialNumber: "MSN-95034", aircraftType: "Sukhoi Superjet 100", model: "SSJ-100", operator: "REFLY Regional", status: "maintenance", manufacturer: "Sukhoi", yearOfManufacture: 2019, flightHours: 12300, engineType: "SaM146-1S18", lastInspectionDate: "2026-01-25", nextInspectionDate: "2026-04-25", certificateExpiry: "2027-02-10" },
  { id: "ac-005", registrationNumber: "RA-61701", serialNumber: "MSN-61045", aircraftType: "An-148-100V", model: "An-148", operator: "Angara", status: "active", manufacturer: "VASO", yearOfManufacture: 2014, flightHours: 19800, engineType: "D-436-148", lastInspectionDate: "2025-10-05", nextInspectionDate: "2026-04-05", certificateExpiry: "2026-10-15" },
  { id: "ac-006", registrationNumber: "RA-96017", serialNumber: "MSN-9650", aircraftType: "Il-96-300", model: "Il-96", operator: "Rossiya", status: "active", manufacturer: "VASO", yearOfManufacture: 2012, flightHours: 32100, engineType: "PS-90A", lastInspectionDate: "2025-09-18", nextInspectionDate: "2026-03-18", certificateExpiry: "2026-09-30" },
  { id: "ac-007", registrationNumber: "RA-73703", serialNumber: "MSN-5102", aircraftType: "Boeing 737-800", model: "737-800", operator: "REFLY Airlines", status: "storage", manufacturer: "Boeing", yearOfManufacture: 2017, flightHours: 21500, engineType: "CFM56-7B26", lastInspectionDate: "2025-08-10", nextInspectionDate: "2026-08-10", certificateExpiry: "2026-08-01" },
  { id: "ac-008", registrationNumber: "RA-89003", serialNumber: "MSN-95056", aircraftType: "Sukhoi Superjet 100", model: "SSJ-100", operator: "Yakutia", status: "active", manufacturer: "Sukhoi", yearOfManufacture: 2020, flightHours: 9800, engineType: "SaM146-1S18", lastInspectionDate: "2026-02-01", nextInspectionDate: "2026-08-01", certificateExpiry: "2027-06-15" },
  { id: "ac-009", registrationNumber: "RA-76511", serialNumber: "MSN-7651", aircraftType: "Il-76TD-90VD", model: "Il-76", operator: "Volga-Dnepr", status: "active", manufacturer: "TAPoiCh", yearOfManufacture: 2011, flightHours: 38200, engineType: "PS-90A-76", lastInspectionDate: "2025-12-20", nextInspectionDate: "2026-06-20", certificateExpiry: "2026-12-31" },
  { id: "ac-010", registrationNumber: "RA-02801", serialNumber: "MSN-2801", aircraftType: "Mi-8MTV-1", model: "Mi-8", operator: "UTair", status: "maintenance", manufacturer: "KVZ", yearOfManufacture: 2013, flightHours: 8900, engineType: "TV3-117VM", lastInspectionDate: "2026-01-15", nextInspectionDate: "2026-04-15", certificateExpiry: "2026-07-20" },
  { id: "ac-011", registrationNumber: "RA-73704", serialNumber: "MSN-5340", aircraftType: "Boeing 737-800", model: "737-800", operator: "REFLY Airlines", status: "active", manufacturer: "Boeing", yearOfManufacture: 2018, flightHours: 18200, engineType: "CFM56-7B26", lastInspectionDate: "2026-01-28", nextInspectionDate: "2026-07-28", certificateExpiry: "2027-05-10" },
  { id: "ac-012", registrationNumber: "RA-89004", serialNumber: "MSN-95078", aircraftType: "Sukhoi Superjet 100", model: "SSJ-100", operator: "REFLY Regional", status: "active", manufacturer: "Sukhoi", yearOfManufacture: 2021, flightHours: 7200, engineType: "SaM146-1S18", lastInspectionDate: "2026-02-05", nextInspectionDate: "2026-08-05", certificateExpiry: "2027-08-20" },
];
const MOCK_ORGANIZATIONS = [
  { id: "org-001", name: "REFLY Airlines", type: "operator", country: "Russia", city: "Moscow", certificate: "SE-001-2024", status: "active", aircraftCount: 4, employeeCount: 1200 },
  { id: "org-002", name: "REFLY Regional", type: "operator", country: "Russia", city: "St Petersburg", certificate: "SE-002-2024", status: "active", aircraftCount: 3, employeeCount: 450 },
  { id: "org-003", name: "Angara", type: "operator", country: "Russia", city: "Irkutsk", certificate: "SE-003-2023", status: "active", aircraftCount: 1, employeeCount: 320 },
  { id: "org-004", name: "S7 Technics", type: "mro", country: "Russia", city: "Novosibirsk", certificate: "MRO-001-2024", status: "active", aircraftCount: 0, employeeCount: 890 },
  { id: "org-005", name: "Rossiya", type: "operator", country: "Russia", city: "St Petersburg", certificate: "SE-005-2024", status: "active", aircraftCount: 1, employeeCount: 3200 },
  { id: "org-006", name: "Rosaviation", type: "authority", country: "Russia", city: "Moscow", status: "active", employeeCount: 1500 },
  { id: "org-007", name: "UTair", type: "operator", country: "Russia", city: "Khanty-Mansiysk", certificate: "SE-007-2023", status: "active", aircraftCount: 1, employeeCount: 2800 },
  { id: "org-008", name: "Volga-Dnepr", type: "operator", country: "Russia", city: "Ulyanovsk", certificate: "SE-008-2024", status: "active", aircraftCount: 1, employeeCount: 1100 },
];
const MOCK_RISKS = [
  { id: "risk-001", title: "C-Check overdue Boeing 737-800 RA-73701", description: "Scheduled C-Check overdue by 12 days", level: "critical", status: "open", aircraftId: "ac-001", registrationNumber: "RA-73701", category: "maintenance", createdAt: "2026-02-01", assignee: "Petrov I.V." },
  { id: "risk-002", title: "Certificate expiry An-148 RA-61701", description: "Airworthiness certificate expires in 8 months", level: "high", status: "open", aircraftId: "ac-005", registrationNumber: "RA-61701", category: "certification", createdAt: "2026-01-15", assignee: "Sidorov A.P." },
  { id: "risk-003", title: "Landing gear defect Mi-8 RA-02801", description: "Micro-crack found in main landing gear strut", level: "critical", status: "in_progress", aircraftId: "ac-010", registrationNumber: "RA-02801", category: "defect", createdAt: "2026-01-28", assignee: "Kozlov D.M." },
  { id: "risk-004", title: "Engine life limit SSJ-100 RA-89003", description: "SaM146 engine approaching max hours. 200 flight hours remaining", level: "high", status: "open", aircraftId: "ac-008", registrationNumber: "RA-89003", category: "engine", createdAt: "2026-02-03", assignee: "Ivanov S.K." },
  { id: "risk-005", title: "Documentation mismatch Il-76", description: "Discrepancies in PS-90A-76 engine logbooks", level: "medium", status: "open", aircraftId: "ac-009", registrationNumber: "RA-76511", category: "documentation", createdAt: "2026-01-20", assignee: "Morozova E.A." },
  { id: "risk-006", title: "Corrosion Boeing 737 RA-73703", description: "Wing area corrosion found during storage", level: "medium", status: "monitoring", aircraftId: "ac-007", registrationNumber: "RA-73703", category: "structural", createdAt: "2025-12-10", assignee: "Belov K.N." },
  { id: "risk-007", title: "Spare parts delay SSJ-100", description: "Critical spare parts delivery delayed 3 weeks", level: "low", status: "open", category: "supply_chain", createdAt: "2026-02-05", assignee: "Volkova M.S." },
  { id: "risk-008", title: "AD update Boeing 737-800", description: "New FAA AD 2026-02-15. Compliance required by 2026-06-01", level: "high", status: "open", category: "airworthiness_directive", createdAt: "2026-02-06", assignee: "Petrov I.V." },
];
const MOCK_AUDITS = [
  { id: "aud-001", title: "Scheduled audit REFLY Airlines", organization: "REFLY Airlines", organizationId: "org-001", type: "scheduled", status: "in_progress", startDate: "2026-02-01", endDate: "2026-02-28", leadAuditor: "Kuznetsov A.V.", findings: 3, criticalFindings: 1, scope: "SMS" },
  { id: "aud-002", title: "Inspection S7 Technics", organization: "S7 Technics", organizationId: "org-004", type: "inspection", status: "planned", startDate: "2026-03-15", endDate: "2026-03-20", leadAuditor: "Novikova L.P.", findings: 0, criticalFindings: 0, scope: "FAP-145" },
  { id: "aud-003", title: "Audit REFLY Regional", organization: "REFLY Regional", organizationId: "org-002", type: "scheduled", status: "completed", startDate: "2025-11-01", endDate: "2025-11-15", leadAuditor: "Kuznetsov A.V.", findings: 5, criticalFindings: 0, scope: "Continuing airworthiness" },
  { id: "aud-004", title: "Unscheduled check Angara", organization: "Angara", organizationId: "org-003", type: "unscheduled", status: "completed", startDate: "2025-12-10", endDate: "2025-12-12", leadAuditor: "Sokolov V.M.", findings: 2, criticalFindings: 1, scope: "An-148 incident" },
  { id: "aud-005", title: "Certification audit UTair", organization: "UTair", organizationId: "org-007", type: "certification", status: "planned", startDate: "2026-04-01", endDate: "2026-04-15", leadAuditor: "Novikova L.P.", findings: 0, criticalFindings: 0, scope: "Helicopter ops" },
  { id: "aud-006", title: "Check Volga-Dnepr", organization: "Volga-Dnepr", organizationId: "org-008", type: "scheduled", status: "in_progress", startDate: "2026-02-05", endDate: "2026-02-20", leadAuditor: "Sokolov V.M.", findings: 1, criticalFindings: 0, scope: "Cargo, DG" },
];
function computeStats() {
  const active = MOCK_AIRCRAFT.filter((a: any) => a.status === "active").length;
  const maint = MOCK_AIRCRAFT.filter((a: any) => a.status === "maintenance").length;
  return {
    aircraft: { total: MOCK_AIRCRAFT.length, active, maintenance: maint, storage: MOCK_AIRCRAFT.length - active - maint },
    risks: { total: MOCK_RISKS.length, critical: MOCK_RISKS.filter((r: any) => r.level === "critical").length, high: MOCK_RISKS.filter((r: any) => r.level === "high").length, medium: MOCK_RISKS.filter((r: any) => r.level === "medium").length, low: MOCK_RISKS.filter((r: any) => r.level === "low").length },
    audits: { current: MOCK_AUDITS.filter((a: any) => a.status === "in_progress").length, upcoming: MOCK_AUDITS.filter((a: any) => a.status === "planned").length, completed: MOCK_AUDITS.filter((a: any) => a.status === "completed").length },
    organizations: { total: MOCK_ORGANIZATIONS.length, operators: MOCK_ORGANIZATIONS.filter((o: any) => o.type === "operator").length, mro: MOCK_ORGANIZATIONS.filter((o: any) => o.type === "mro").length },
  };
}
export async function getCachedAircraft(filters?: any): Promise<any[]> {
  if (!USE_MOCK) {
    try {
      const data = await fetchAircraftFromBackend(filters);
      let out = data;
      if (filters?.type) out = out.filter((a: any) => a.aircraftType?.toLowerCase().includes(filters.type.toLowerCase()));
      if (filters?.status) out = out.filter((a: any) => a.status === filters.status);
      if (filters?.operator) out = out.filter((a: any) => a.operator?.toLowerCase().includes(filters.operator.toLowerCase()));
      return out;
    } catch {
      /* fallback to mock */
    }
  }
  let data = [...MOCK_AIRCRAFT];
  if (filters?.type) data = data.filter((a: any) => a.aircraftType.toLowerCase().includes(filters.type.toLowerCase()));
  if (filters?.status) data = data.filter((a: any) => a.status === filters.status);
  if (filters?.operator) data = data.filter((a: any) => a.operator.toLowerCase().includes(filters.operator.toLowerCase()));
  return data;
}
export async function getCachedOrganizations(filters?: any): Promise<any[]> {
  if (!USE_MOCK) {
    try {
      const data = await fetchOrganizationsFromBackend();
      return filters?.type ? data.filter((o: any) => o.type === filters.type) : data;
    } catch {
      /* fallback */
    }
  }
  let data = [...MOCK_ORGANIZATIONS];
  if (filters?.type) data = data.filter((o: any) => o.type === filters.type);
  return data;
}
export async function getCachedRisks(filters?: any): Promise<any[]> {
  if (!USE_MOCK) {
    try {
      const data = await fetchRiskAlertsFromBackend(filters);
      return data;
    } catch {
      /* fallback */
    }
  }
  let data = [...MOCK_RISKS];
  if (filters?.level) data = data.filter((r: any) => r.level === filters.level);
  if (filters?.status) data = data.filter((r: any) => r.status === filters.status);
  return data;
}
export async function getCachedAudits(filters?: any): Promise<any[]> {
  if (!USE_MOCK) {
    try {
      const data = await fetchAuditsFromBackend(filters);
      return data;
    } catch {
      /* fallback */
    }
  }
  let data = [...MOCK_AUDITS];
  if (filters?.organizationId) data = data.filter((a: any) => a.organizationId === filters.organizationId);
  if (filters?.status) data = data.filter((a: any) => a.status === filters.status);
  return data;
}
export async function getCachedStats(): Promise<any> {
  if (!USE_MOCK) {
    try {
      return await fetchStatsFromBackend();
    } catch {
      /* fallback */
    }
  }
  return computeStats();
}
