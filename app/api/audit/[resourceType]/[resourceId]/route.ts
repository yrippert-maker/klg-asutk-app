export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getAuditHistory } from '@/lib/audit/audit-service';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/audit/[resourceType]/[resourceId] - История изменений ресурса
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { resourceType: string; resourceId: string } }
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await getAuditHistory(
      params.resourceType,
      params.resourceId,
      limit
    );

    return NextResponse.json({ history });
  } catch (error) {
    return handleError(error, {
      path: `/api/audit/${params.resourceType}/${params.resourceId}`,
      method: 'GET',
    });
  }
}
