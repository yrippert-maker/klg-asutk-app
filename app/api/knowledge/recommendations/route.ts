import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      recommendations: [],
      context: body.context || '',
      message: 'Recommendations stub — connect to AI service for real data'
    });
  } catch {
    return NextResponse.json({ recommendations: [] });
  }
}
