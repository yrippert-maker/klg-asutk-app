const op = { check: () => true };
export const overloadProtectors: Record<string, any> = new Proxy({}, { get: () => op });
export function overloadProtection(...a: any[]): any { return null; }