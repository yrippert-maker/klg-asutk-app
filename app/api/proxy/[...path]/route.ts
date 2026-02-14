/**
 * Universal API proxy — forwards /api/proxy/* to backend.
 * Replaces individual proxy routes.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${BACKEND}/api/v1/${path}${req.nextUrl.search}`;
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (!['host', 'connection'].includes(k)) headers[k] = v; });

  try {
    const opts: RequestInit = { method: req.method, headers };
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) opts.body = await req.text();
    const res = await fetch(url, opts);
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Backend unavailable', detail: e.message }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
