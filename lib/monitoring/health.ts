/** Проверка состояния системы. MVP: проверяет бэкенд через /api/v1/health */
interface HealthCheck {
  status: 'ok' | 'error';
  message?: string;
}

interface HealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: HealthCheck;
    backend?: HealthCheck;
  };
}

export async function checkHealth(): Promise<HealthResult> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const backendUrl = apiBase ? `${apiBase.replace(/\/+$/, '')}/health` : '/api/v1/health';

  let backendStatus: HealthCheck = { status: 'ok' };
  try {
    const res = await fetch(backendUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) backendStatus = { status: 'error', message: `HTTP ${res.status}` };
  } catch (e) {
    backendStatus = { status: 'error', message: e instanceof Error ? e.message : 'Backend unreachable' };
  }

  const dbOk = backendStatus.status === 'ok';
  return {
    status: dbOk ? 'healthy' : 'degraded',
    checks: {
      database: dbOk ? { status: 'ok' } : { status: 'error', message: 'Backend/DB check failed' },
      backend: backendStatus,
    },
  };
}
