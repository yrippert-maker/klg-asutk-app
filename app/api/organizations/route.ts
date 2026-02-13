export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedOrganizations } from '@/lib/api/cached-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => { filters[key] = value; });
    const data = await getCachedOrganizations(filters);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
