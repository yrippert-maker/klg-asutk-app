export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/monitoring/metrics';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * API endpoint для получения метрик
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request), 100, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const endpoint = searchParams.get('endpoint');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const metricName = searchParams.get('metricName');
    const periodMs = parseInt(searchParams.get('periodMs') || '60000');

    if (type === 'performance') {
      // Получить статистику по метрике производительности
      const metricKey = endpoint ? `performance.${endpoint}` : 'performance';
      const stats = metrics.getStats(metricKey, periodMs);
      return NextResponse.json({
        type: 'performance',
        stats,
      });
    }

    if (type === 'performance-details') {
      // Получить детальные метрики производительности
      const metricKey = endpoint ? `performance.${endpoint}` : 'performance';
      const metricsData = metrics.getMetrics(
        metricKey,
        startTime ? new Date(startTime) : undefined,
        endTime ? new Date(endTime) : undefined
      );
      return NextResponse.json({
        type: 'performance-details',
        metrics: metricsData,
        count: metricsData.length,
      });
    }

    if (metricName) {
      // Получить статистику по конкретной метрике
      const stats = metrics.getStats(metricName, periodMs);
      return NextResponse.json({
        metric: metricName,
        stats,
      });
    }

    // Все метрики
    const allMetrics = metrics.getMetrics(
      undefined,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined
    );

    return NextResponse.json({
      type: 'all',
      metrics: allMetrics,
      count: allMetrics.length,
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/metrics',
      method: 'GET',
    });
  }
}
