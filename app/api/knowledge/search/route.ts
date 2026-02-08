import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      results: [],
      query: body.query || '',
      total: 0,
      message: 'Search stub — connect to search service for real data'
    });
  } catch {
    return NextResponse.json({ results: [], total: 0 });
  }
}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  return NextResponse.json({ results: [], query: q, total: 0 });
}
