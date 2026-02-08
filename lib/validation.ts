export const filterSchema = { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) };
export const aircraftSchema = { parse: (data: any) => data, safeParse: (data: any) => ({ success: true, data }) };
export function validate(...a: any[]): any { return true; }
export function validateInput(...a: any[]): any { return true; }
