export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getAircraftAnalytics } from '@/lib/analytics/clickhouse-client';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const operator = searchParams.get('operator');

    const filters: any = {};
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    if (operator) {
      filters.operator = operator;
    }

    // Получаем аналитику из ClickHouse
    const analytics = await getAircraftAnalytics(filters);

    // Агрегируем результаты
    const total = analytics.reduce((sum, item) => sum + (item.total || 0), 0);
    const active = analytics.reduce((sum, item) => sum + (item.active || 0), 0);
    const maintenance = analytics.reduce((sum, item) => sum + (item.maintenance || 0), 0);

    return NextResponse.json({
      total,
      active,
      maintenance,
      byOperator: analytics.map(item => ({
        operator: item.operator,
        count: item.total,
        avgFlightHours: item.avgFlightHours,
        maxFlightHours: item.maxFlightHours,
      })),
    });
  } catch (error: any) {
    return handleError(error, {
      path: '/api/analytics/aircraft',
      method: 'GET',
    });
  }
}
