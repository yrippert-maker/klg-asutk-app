export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedAudits } from '@/lib/api/cached-api';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * API Route для получения списка аудитов
 * Поддерживает кэширование и фильтрацию
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (мягкий лимит)
    try {
      const identifier = getRateLimitIdentifier(request);
      const rateLimitResult = rateLimit(identifier, 200, 60000);
      if (!rateLimitResult.allowed) {
        console.warn('Rate limit warning for /api/audits');
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed, continuing:', rateLimitError);
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      organizationId: searchParams.get('organizationId') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    const audits = await getCachedAudits(filters);

    return NextResponse.json(audits, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/audits',
      method: 'GET',
    });
  }
}
