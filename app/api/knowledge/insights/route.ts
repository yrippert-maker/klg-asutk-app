import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      insights: [],
      query: body.query || '',
      message: 'Knowledge insights stub — connect to AI service for real data'
    });
  } catch {
    return NextResponse.json({ insights: [], message: 'No query provided' });
  }
}
