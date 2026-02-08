export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { searchAircraft } from '@/lib/search/opensearch-client';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query, type = 'all', limit = 20, filters = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Параметр query обязателен' },
        { status: 400 }
      );
    }

    // Поиск через OpenSearch
    const results: any[] = [];

    if (type === 'aircraft' || type === 'all') {
      const aircraftResults = await searchAircraft(query, filters);
      results.push(...aircraftResults.map(r => ({
        type: 'aircraft',
        ...r,
      })));
    }

    // Можно добавить поиск по другим типам (audits, risks, etc.)

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error: any) {
    return handleError(error, {
      path: '/api/search',
      method: 'POST',
    });
  }
}
