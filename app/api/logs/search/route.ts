export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { searchAllLogs, LogSearchFilters } from '@/lib/logs/log-search';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/logs/search - Поиск по логам
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(identifier);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const filters: LogSearchFilters = {
      level: searchParams.get('level') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      search: searchParams.get('search') || undefined,
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '100');
    const logs = await searchAllLogs(filters);

    // Ограничиваем количество результатов
    const limitedLogs = logs.slice(0, limit);

    return NextResponse.json({
      logs: limitedLogs,
      total: logs.length,
      limit,
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/logs/search',
      method: 'GET',
    });
  }
}
