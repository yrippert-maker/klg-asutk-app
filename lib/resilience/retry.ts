export async function retryWithBackoff(fn: any, ...a: any[]) { return fn(); }
export const RETRY_CONFIGS: Record<string, any> = new Proxy({}, { get: () => ({ retries: 3 }) });