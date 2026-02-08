export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/notifications/notification-service';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * POST /api/notifications/[id]/read - Отметить уведомление как прочитанное
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = request.headers.get('x-user-id') || undefined;
    await markNotificationAsRead(params.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, {
      path: `/api/notifications/${params.id}/read`,
      method: 'POST',
    });
  }
}
