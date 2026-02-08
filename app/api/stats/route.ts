export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedStats } from '@/lib/api/cached-api';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * API Route для получения статистики
 * Поддерживает кэширование (TTL: 5 минут)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (мягкий лимит)
    try {
      const identifier = getRateLimitIdentifier(request);
      const rateLimitResult = rateLimit(identifier, 200, 60000);
      if (!rateLimitResult.allowed) {
        console.warn('Rate limit warning for /api/stats');
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed, continuing:', rateLimitError);
    }

    const stats = await getCachedStats();

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/stats',
      method: 'GET',
    });
  }
}
