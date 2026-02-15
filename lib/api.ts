/**
 * DEPRECATED: Use @/lib/api/api-client instead.
 * This file kept for backward-compatible type exports.
 */

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
  [key: string]: any;
}

// Re-export from new API client
export { aircraftApi, organizationsApi, healthApi } from './api/api-client';
