export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedAircraft } from '@/lib/api/cached-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => { filters[key] = value; });

    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '50');
    
    const allData = await getCachedAircraft(filters);
    const total = allData.length;
    const start = (page - 1) * limit;
    const data = allData.slice(start, start + limit);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } }, { status: 500 });
  }
}
