export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { processNaturalLanguageQuery, detectIntent } from '@/lib/ai/natural-language-interface';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { withTimeout, TIMEOUTS } from '@/lib/resilience/timeout';
import { bulkheads } from '@/lib/resilience/bulkhead';
import { overloadProtectors } from '@/lib/resilience/overload-protection';
import { tracedOperation, tracer } from '@/lib/tracing/tracer';
import { recordPerformance } from '@/lib/monitoring/metrics';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceContext = tracer.createTrace('POST /api/ai/agent', {
    method: 'POST',
    path: '/api/ai/agent',
  });

  try {
    // Overload protection
    if (!overloadProtectors.ai.check()) {
      recordPerformance('/api/ai/agent', Date.now() - startTime, 503, { method: 'POST' });
      tracer.finishSpan(traceContext, 'error', new Error('Service overloaded'));
      return NextResponse.json(
        { error: 'AI service overloaded, please try again later' },
        { status: 503 }
      );
    }

    // Rate limiting
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request));
    if (!rateLimitResult.allowed) {
      recordPerformance('/api/ai/agent', Date.now() - startTime, 429, { method: 'POST' });
      tracer.finishSpan(traceContext, 'error', new Error('Rate limit exceeded'));
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query, mode = 'copilot', context } = body;

    if (!query || typeof query !== 'string') {
      tracer.finishSpan(traceContext, 'error', new Error('Missing query parameter'));
      return NextResponse.json(
        { error: 'Параметр query обязателен' },
        { status: 400 }
      );
    }

    tracer.addTag(traceContext, 'mode', mode);
    tracer.addTag(traceContext, 'query_length', query.length.toString());

    // Используем bulkhead для изоляции AI операций
    const result = await bulkheads.ai.execute(async () => {
      // Определяем намерение с timeout и tracing
      const intent = await tracedOperation(
        traceContext,
        'detect-intent',
        async () => {
          return await withTimeout(
            detectIntent(query),
            TIMEOUTS.AI_API / 2,
            'Intent detection timeout'
          );
        }
      );

      // Обрабатываем запрос с timeout и tracing
      const response = await tracedOperation(
        traceContext,
        'process-natural-language-query',
        async () => {
          return await withTimeout(
            processNaturalLanguageQuery({
              query,
              mode: mode === 'autonomous' ? 'autonomous' : 'copilot',
              context,
            }),
            TIMEOUTS.AI_API,
            'Natural language query processing timeout'
          );
        },
        { mode }
      );

      return {
        ...response,
        intent,
      };
    });

    const duration = Date.now() - startTime;
    recordPerformance('/api/ai/agent', duration, 200, { method: 'POST' });
    tracer.finishSpan(traceContext, 'completed');

    return NextResponse.json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    recordPerformance('/api/ai/agent', duration, 500, { method: 'POST' });
    tracer.finishSpan(traceContext, 'error', error);
    return handleError(error, {
      path: '/api/ai/agent',
      method: 'POST',
    });
  }
}
