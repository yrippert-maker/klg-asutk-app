export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { sendCriticalRiskEmail, sendUpcomingAuditEmail } from '@/lib/notifications/email-service';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * POST /api/notifications/email - Отправка email уведомления
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
    const { type, ...data } = body;

    let success = false;

    if (type === 'critical_risk') {
      success = await sendCriticalRiskEmail(
        data.userEmail,
        data.riskTitle,
        data.aircraftRegistration,
        data.riskId
      );
    } else if (type === 'upcoming_audit') {
      success = await sendUpcomingAuditEmail(
        data.userEmail,
        data.auditType,
        data.organizationName,
        data.auditDate,
        data.daysUntil
      );
    } else {
      return NextResponse.json(
        { error: 'Неверный тип уведомления' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success });
  } catch (error) {
    return handleError(error, {
      path: '/api/notifications/email',
      method: 'POST',
    });
  }
}
