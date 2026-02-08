export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getTimeSeriesData, comparePeriods, forecast, getUserActivityStats } from '@/lib/analytics/analytics-service';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/analytics - Получение аналитических данных
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = await rateLimit(identifier);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const resourceType = searchParams.get('resourceType') || 'aircraft';

    if (type === 'timeseries') {
      const startDate = new Date(searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(searchParams.get('endDate') || new Date());
      const groupBy = (searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month';

      const data = await getTimeSeriesData(resourceType, startDate, endDate, groupBy);
      return NextResponse.json({ data });
    }

    if (type === 'compare') {
      const currentStart = new Date(searchParams.get('currentStart') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const currentEnd = new Date(searchParams.get('currentEnd') || new Date());
      const previousStart = new Date(searchParams.get('previousStart') || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
      const previousEnd = new Date(searchParams.get('previousEnd') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      const data = await comparePeriods(resourceType, currentStart, currentEnd, previousStart, previousEnd);
      return NextResponse.json({ data });
    }

    if (type === 'forecast') {
      const days = parseInt(searchParams.get('days') || '30');
      const data = await forecast(resourceType, days);
      return NextResponse.json({ data });
    }

    if (type === 'activity') {
      const startDate = new Date(searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(searchParams.get('endDate') || new Date());
      const stats = await getUserActivityStats(startDate, endDate);
      return NextResponse.json({ stats });
    }

    return NextResponse.json(
      { error: 'Неверный тип запроса' },
      { status: 400 }
    );
  } catch (error) {
    return handleError(error, {
      path: '/api/analytics',
      method: 'GET',
    });
  }
}
