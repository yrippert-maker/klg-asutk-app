export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedStats } from '@/lib/api/cached-api';

export async function GET(request: NextRequest) {
  try {
    const stats = await getCachedStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    return NextResponse.json({ aircraft: { total: 0, active: 0, maintenance: 0 }, risks: { total: 0, critical: 0, high: 0 }, audits: { current: 0, upcoming: 0, completed: 0 } }, { status: 500 });
  }
}
