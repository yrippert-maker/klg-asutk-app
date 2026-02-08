export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { checkHealth } from '@/lib/monitoring/health';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const readiness = searchParams.get('readiness') === 'true';

  const health = await checkHealth();

  // Для readiness probe проверяем, что система готова принимать трафик
  if (readiness) {
    // Readiness означает, что система может обрабатывать запросы
    // Проверяем, что хотя бы основные компоненты работают
    const isReady =
      health.status === 'healthy' ||
      (health.status === 'degraded' &&
        health.checks.database.status === 'ok'); // БД должна быть доступна

    if (!isReady) {
      return NextResponse.json(
        {
          status: 'not ready',
          message: 'System is not ready to accept traffic',
          checks: health.checks,
        },
        { status: 503 }
      );
    }
  }

  // Для liveness probe возвращаем общий статус
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}
