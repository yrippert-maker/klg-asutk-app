export const dynamic = "force-dynamic";
/**
 * Proxy к FastAPI /api/v1/inbox или inbox-server.
 * При наличии NEXT_PUBLIC_BACKEND_URL направляет запросы в FastAPI.
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const INBOX_SERVER = process.env.INBOX_SERVER_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const base = BACKEND ? `${BACKEND}/api/v1/inbox` : `${INBOX_SERVER}/api/inbox`;
    const res = await fetch(`${base}/files`, {
      headers: BACKEND ? { Authorization: 'Bearer dev' } : {},
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}
