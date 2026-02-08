export async function withTimeout(fn: any, ...a: any[]) { return fn(); }
export const TIMEOUTS: Record<string, any> = new Proxy({}, { get: () => 30000 });