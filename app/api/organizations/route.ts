export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedOrganizations } from '@/lib/api/cached-api';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * API Route для получения списка организаций
 * Поддерживает кэширование
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (мягкий лимит)
    try {
      const identifier = getRateLimitIdentifier(request);
      const rateLimitResult = rateLimit(identifier, 200, 60000);
      if (!rateLimitResult.allowed) {
        console.warn('Rate limit warning for /api/organizations');
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed, continuing:', rateLimitError);
    }

    const organizations = await getCachedOrganizations();

    return NextResponse.json(organizations, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/organizations',
      method: 'GET',
    });
  }
}
