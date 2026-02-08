const cb = { fire: async (fn: any) => fn(), isOpen: () => false };
export const circuitBreakers: Record<string, any> = new Proxy({}, { get: () => cb });
export function circuitBreaker(...a: any[]): any { return null; }