export interface ComplianceChecklist { id?: string; title?: string; items?: any[]; format?: string; [key: string]: any; }
export const ICAOCategories: Record<string, string[]> = {};
export const EASACategories: Record<string, string[]> = {};
export const FAACategories: Record<string, string[]> = {};
export const ARMACCategories: Record<string, string[]> = {};
export function createICAOChecklist(...a: any[]): any { return { items: [] }; }
export function createEASAChecklist(...a: any[]): any { return { items: [] }; }
export function createFAAChecklist(...a: any[]): any { return { items: [] }; }
export function createARMACChecklist(...a: any[]): any { return { items: [] }; }
export function createUniversalChecklist(...a: any[]): any { return { items: [] }; }
export function formatChecklist(...a: any[]): any { return {}; }
export default {};
