export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { tracer } from '@/lib/tracing/tracer';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request), 100, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const traceId = searchParams.get('traceId');

    if (traceId) {
      // Получить конкретный trace
      const trace = tracer.exportTrace(traceId);
      if (!trace) {
        return NextResponse.json(
          { error: 'Trace not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(trace);
    }

    // Получить все traces (последние 100)
    const allTraces = tracer.getAllTraces();
    const traces = Array.from(allTraces.entries())
      .slice(-100)
      .map(([traceId, spans]) => ({
        traceId,
        spanCount: spans.length,
        duration: spans[spans.length - 1]?.duration || 0,
        status: spans[spans.length - 1]?.status || 'unknown',
        operation: spans[0]?.operation || 'unknown',
      }));

    return NextResponse.json({
      traces,
      total: allTraces.size,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
