export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getAllNotifications } from '@/lib/notifications/notification-service';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/notifications - Получение всех уведомлений
 */
export async function GET(request: NextRequest) {
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

    const notifications = await getAllNotifications();

    // Преобразуем Date в строки для JSON
    const serializedNotifications = notifications.map(n => ({
      ...n,
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
    }));

    return NextResponse.json({
      notifications: serializedNotifications,
      count: serializedNotifications.length,
      unreadCount: serializedNotifications.filter(n => !n.read).length,
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/notifications',
      method: 'GET',
    });
  }
}
