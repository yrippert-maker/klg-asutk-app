export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { rollbackChange } from '@/lib/audit/audit-service';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { logSecurity } from '@/lib/logger';

/**
 * POST /api/audit/rollback - Откат изменений
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(identifier);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { auditLogId } = body;

    if (!auditLogId) {
      return NextResponse.json(
        { error: 'Не указан ID записи аудита' },
        { status: 400 }
      );
    }

    // Логируем попытку отката
    logSecurity('Попытка отката изменений', {
      auditLogId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    const success = await rollbackChange(auditLogId);

    if (success) {
      return NextResponse.json({ success: true, message: 'Изменения успешно откачены' });
    } else {
      return NextResponse.json(
        { error: 'Не удалось откатить изменения' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка при откате изменений' },
      { status: 500 }
    );
  }
}
