export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedRisks } from '@/lib/api/cached-api';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * API Route для получения списка рисков
 * Поддерживает кэширование и фильтрацию
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (мягкий лимит)
    try {
      const identifier = getRateLimitIdentifier(request);
      const rateLimitResult = rateLimit(identifier, 200, 60000);
      if (!rateLimitResult.allowed) {
        console.warn('Rate limit warning for /api/risks');
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed, continuing:', rateLimitError);
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      level: searchParams.get('level') || undefined,
      status: searchParams.get('status') || undefined,
      aircraftId: searchParams.get('aircraftId') || undefined,
    };

    const risks = await getCachedRisks(filters);

    return NextResponse.json(risks, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/risks',
      method: 'GET',
    });
  }
}
