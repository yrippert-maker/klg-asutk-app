export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/monitoring/metrics';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request), 100, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('name');
    const level = searchParams.get('level') as 'info' | 'warning' | 'error' | 'critical' | null;
    const component = searchParams.get('component');
    const periodMs = parseInt(searchParams.get('periodMs') || '60000');

    // Получить метрики
    if (metricName) {
      const stats = metrics.getStats(metricName, periodMs);
      return NextResponse.json({
        metric: metricName,
        stats,
      });
    }

    // Получить алерты
    if (level || component) {
      const alerts = metrics.getAlerts(level || undefined, component || undefined);
      return NextResponse.json({
        alerts: alerts.slice(-100), // Последние 100 алертов
        count: alerts.length,
      });
    }

    // Общая статистика
    const recentMetrics = metrics.getMetrics(undefined, new Date(Date.now() - periodMs));
    const recentAlerts = metrics.getAlerts();

    return NextResponse.json({
      metrics: {
        total: recentMetrics.length,
        byName: recentMetrics.reduce((acc, m) => {
          acc[m.name] = (acc[m.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      alerts: {
        total: recentAlerts.length,
        byLevel: recentAlerts.reduce((acc, a) => {
          acc[a.level] = (acc[a.level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent: recentAlerts.slice(-10),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
