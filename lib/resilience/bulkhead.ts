const handler = { execute: async (fn: any) => fn() };
export const bulkheads: Record<string, any> = new Proxy({}, { get: () => handler });
export function bulkhead(...a: any[]): any { return null; }