export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ nodes: [], edges: [], message: "Knowledge graph stub" }, { status: 200 });
}
